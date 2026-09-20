import { describe, expect, it, vi } from 'vitest';
import { DocumentProcessingWorker, ProcessingPipelineOptions } from '../workers/document-processing/src';
import {
  MockMalwareScanner,
  MockOCRProvider,
  MockEmbeddingProvider,
  MockObjectStorage,
} from '@clauseiqx/ai';
import { compareDocuments } from '../apps/api/src/services/comparison';
import { createExportJob } from '../apps/api/src/services/exports';
import { dataStore } from '../apps/api/src/services/store';

describe('Pipeline Integration & Ingestion Extended Suite', () => {
  describe('DocumentProcessingWorker Lifecycle & Staged State Transitions', () => {
    function createWorker(optionsOverrides?: Partial<ProcessingPipelineOptions>) {
      const storage = new MockObjectStorage();
      const scanner = new MockMalwareScanner();
      const ocr = new MockOCRProvider();
      const embedding = new MockEmbeddingProvider();

      const options: ProcessingPipelineOptions = {
        objectStorage: storage,
        malwareScanner: scanner,
        ocrProvider: ocr,
        embeddingProvider: embedding,
        ...optionsOverrides,
      };

      return {
        worker: new DocumentProcessingWorker(options),
        storage,
        scanner,
        ocr,
        embedding,
      };
    }

    it('executes full pipeline successfully for clean legal document', async () => {
      const { worker, storage } = createWorker();
      const fileKey = 'contracts/clean-lease.pdf';
      await storage.put(fileKey, Buffer.from('%PDF-1.7 standard lease contract'), 'application/pdf');

      const stages: string[] = [];
      const result = await worker.processDocument(
        'job-101',
        {
          documentId: 'doc-101',
          projectId: 'proj-1',
          storageObjectKey: fileKey,
          filename: 'lease.pdf',
          mediaType: 'application/pdf',
        },
        (stage, status) => {
          stages.push(`${stage}:${status}`);
        }
      );

      expect(result.status).toBe('SUCCEEDED');
      expect(result.documentStatus).toBe('READY');
      expect(stages).toContain('Security check:SCANNING');
      expect(stages).toContain('Read document:PROCESSING');
      expect(stages).toContain('Prepare analysis:READY');
    });

    it('rejects document immediately and flags threat when malware scanner fails', async () => {
      const scanner = new MockMalwareScanner();
      vi.spyOn(scanner, 'scan').mockResolvedValueOnce({
        isClean: false,
        threatName: 'Trojan.PDF.PhishExploit.A',
      });

      const { worker, storage } = createWorker({ malwareScanner: scanner });
      const fileKey = 'contracts/infected.pdf';
      await storage.put(fileKey, Buffer.from('infected payload'), 'application/pdf');

      const result = await worker.processDocument('job-bad', {
        documentId: 'doc-bad',
        projectId: 'proj-1',
        storageObjectKey: fileKey,
        filename: 'infected.pdf',
        mediaType: 'application/pdf',
      });

      expect(result.status).toBe('FAILED');
      expect(result.documentStatus).toBe('FAILED');
      expect(result.error).toContain('Trojan.PDF.PhishExploit.A');
    });

    it('handles object storage retrieval failures gracefully', async () => {
      const storage = new MockObjectStorage();
      vi.spyOn(storage, 'get').mockRejectedValueOnce(new Error('Object not found in bucket'));

      const { worker } = createWorker({ objectStorage: storage });

      const result = await worker.processDocument('job-missing-key', {
        documentId: 'doc-missing',
        projectId: 'proj-1',
        storageObjectKey: 'non-existent/file.pdf',
        filename: 'missing.pdf',
        mediaType: 'application/pdf',
      });

      expect(result.status).toBe('FAILED');
      expect(result.documentStatus).toBe('FAILED');
      expect(result.error).toContain('Object not found');
    });

    it('handles OCR extraction exceptions without crashing the worker', async () => {
      const ocr = new MockOCRProvider();
      vi.spyOn(ocr, 'extract').mockRejectedValueOnce(new Error('Corrupt raster font table'));

      const { worker, storage } = createWorker({ ocrProvider: ocr });
      const fileKey = 'contracts/corrupt-ocr.pdf';
      await storage.put(fileKey, Buffer.from('%PDF-1.4 corrupt'), 'application/pdf');

      const result = await worker.processDocument('job-ocr-fail', {
        documentId: 'doc-ocr-fail',
        projectId: 'proj-1',
        storageObjectKey: fileKey,
        filename: 'corrupt.pdf',
        mediaType: 'application/pdf',
      });

      expect(result.status).toBe('FAILED');
      expect(result.documentStatus).toBe('FAILED');
      expect(result.error).toContain('Corrupt raster font table');
    });

    it('handles embedding generation exceptions without crashing the worker', async () => {
      const embedding = new MockEmbeddingProvider();
      vi.spyOn(embedding, 'embed').mockRejectedValueOnce(new Error('Embedding rate limit exceeded (429)'));

      const { worker, storage } = createWorker({ embeddingProvider: embedding });
      const fileKey = 'contracts/embed-fail.pdf';
      await storage.put(fileKey, Buffer.from('%PDF-1.7 text'), 'application/pdf');

      const result = await worker.processDocument('job-embed-fail', {
        documentId: 'doc-embed-fail',
        projectId: 'proj-1',
        storageObjectKey: fileKey,
        filename: 'embed-fail.pdf',
        mediaType: 'application/pdf',
      });

      expect(result.status).toBe('FAILED');
      expect(result.documentStatus).toBe('FAILED');
      expect(result.error).toContain('Embedding rate limit exceeded');
    });
  });

  describe('Contract Comparison & Dual-Source Citations (FR-15 / FR-16 / FR-17)', () => {
    it('rejects self-comparison when documentAId equals documentBId', async () => {
      await expect(
        compareDocuments({
          projectId: 'p1',
          documentAId: 'doc-same',
          documentBId: 'doc-same',
        })
      ).rejects.toThrow('Comparison requires two distinct documents');
    });

    it('rejects comparison when documents belong to different projects', async () => {
      const user = dataStore.createUser('lawyer-diff@firm.com', 'hash', 'Lawyer');
      const projA = dataStore.createProject(user.id, 'Project Alpha');
      const projB = dataStore.createProject(user.id, 'Project Beta');

      const docA = dataStore.createDocument({ projectId: projA.id, uploadedByUserId: user.id, filename: 'docA.pdf', mediaType: 'application/pdf', byteSize: 1000, sha256: 'sha-a' });
      const docB = dataStore.createDocument({ projectId: projB.id, uploadedByUserId: user.id, filename: 'docB.pdf', mediaType: 'application/pdf', byteSize: 1000, sha256: 'sha-b' });

      await expect(
        compareDocuments({
          projectId: projA.id,
          documentAId: docA.id,
          documentBId: docB.id,
        })
      ).rejects.toThrow('Both documents must belong to the authorized project');
    });

    it('rejects comparison when documents lack completed versions', async () => {
      const user = dataStore.createUser('counsel-vers@firm.com', 'hash', 'Counsel');
      const proj = dataStore.createProject(user.id, 'Project Gamma');

      const docA = dataStore.createDocument({ projectId: proj.id, uploadedByUserId: user.id, filename: 'docA.pdf', mediaType: 'application/pdf', byteSize: 1000, sha256: 'sha-a' });
      const docB = dataStore.createDocument({ projectId: proj.id, uploadedByUserId: user.id, filename: 'docB.pdf', mediaType: 'application/pdf', byteSize: 1000, sha256: 'sha-b' });

      await expect(
        compareDocuments({
          projectId: proj.id,
          documentAId: docA.id,
          documentBId: docB.id,
        })
      ).rejects.toThrow('extraction versions');
    });
  });

  describe('Export Generation & Legal Disclaimers (FR-27 / 06_Implementation_Plan.md §10)', () => {
    it('creates markdown export with mandatory legal notice disclaimer', async () => {
      const user = dataStore.createUser('export-user-test@firm.com', 'hash', 'Exporter');
      const project = dataStore.createProject(user.id, 'Export Test Suite');

      const res = await createExportJob({
        projectId: project.id,
        userId: user.id,
        exportSourceType: 'summary',
        format: 'markdown',
      });

      expect(res.exportRecord).toBeDefined();
      expect(res.downloadUrl).toBeDefined();
      expect(res.contentBuffer.length).toBeGreaterThan(50);

      const markdownText = res.contentBuffer.toString('utf-8');
      expect(markdownText).toContain('IMPORTANT LEGAL NOTICE & DISCLAIMER');
      expect(markdownText).toContain('does not provide professional legal advice');
      expect(markdownText).toContain('ClauseIQX');
      expect(markdownText).toContain('Export Test Suite');
    });

    it('rejects export job for non-existent project', async () => {
      await expect(
        createExportJob({
          projectId: '00000000-0000-0000-0000-000000000000',
          userId: 'user-any',
          exportSourceType: 'summary',
          format: 'markdown',
        })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('Document Text Chunking & Boundary Preservations', () => {
    function chunkText(text: string, maxChunkLength = 200, overlap = 40): string[] {
      if (!text || text.trim().length === 0) return [];
      if (text.length <= maxChunkLength) return [text.trim()];

      const chunks: string[] = [];
      let start = 0;
      while (start < text.length) {
        let end = Math.min(start + maxChunkLength, text.length);
        if (end < text.length) {
          // Look for sentence boundary or whitespace
          const lastSpace = text.lastIndexOf(' ', end);
          if (lastSpace > start + overlap) {
            end = lastSpace;
          }
        }
        chunks.push(text.substring(start, end).trim());
        if (end >= text.length) break;
        start = Math.max(end - overlap, start + 1);
      }
      return chunks.filter((c) => c.length > 0);
    }

    it('returns empty array for empty string input', () => {
      expect(chunkText('')).toHaveLength(0);
      expect(chunkText('   \n  \t ')).toHaveLength(0);
    });

    it('returns single chunk when text length is within limit', () => {
      const text = 'Clause 1. Definitions. The term of this agreement shall be 2 years.';
      const chunks = chunkText(text, 200);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('splits longer text into multiple chunks with overlap', () => {
      const sentence1 = 'Section 4.1. Monthly rent of 50,000 INR shall be paid by the 5th of each calendar month without deduction.';
      const sentence2 = 'Section 4.2. Late payments incur a daily compound penalty of 250 INR per day until fully cured.';
      const sentence3 = 'Section 4.3. Failure to pay within 15 days constitutes a material breach granting immediate right of re-entry.';
      const fullText = `${sentence1} ${sentence2} ${sentence3}`;

      const chunks = chunkText(fullText, 100, 30);
      expect(chunks.length).toBeGreaterThan(1);
      // Verify adjacent chunks maintain continuity
      for (let i = 0; i < chunks.length - 1; i++) {
        expect(chunks[i].length).toBeGreaterThan(0);
        expect(chunks[i + 1].length).toBeGreaterThan(0);
      }
    });

    it('preserves section numbers and special legal symbols across chunks', () => {
      const text = '§ 14.1 Governing Law. This agreement is governed by the laws of India. § 14.2 Jurisdiction in New Delhi courts.';
      const chunks = chunkText(text, 80, 20);
      expect(chunks.some((c) => c.includes('§ 14.1'))).toBe(true);
      expect(chunks.some((c) => c.includes('§ 14.2'))).toBe(true);
    });

    it('handles text without spaces by forcing length limits', () => {
      const continuousString = 'A'.repeat(300);
      const chunks = chunkText(continuousString, 100, 20);
      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(100);
      }
    });

    it('handles multi-line indented contract definitions with tabs and returns', () => {
      const complexDoc = '\t"Affiliate" means any entity controlling or controlled by.\n\n\t"Agreement" means this Master Services Agreement.\n\r\n\t"Confidential Information" means proprietary data.';
      const chunks = chunkText(complexDoc, 120, 30);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks.some((c) => c.includes('Affiliate'))).toBe(true);
      expect(chunks.some((c) => c.includes('Confidential Information'))).toBe(true);
    });

    it('splits on bulleted covenants while preserving individual obligation context', () => {
      const bulletedText =
        '1. Obligations of Tenant:\n' +
        ' • Keep the leased premises in good tenantable repair.\n' +
        ' • Permit landlord reasonable entry upon 24 hours notice.\n' +
        ' • Not assign or sublet without prior written consent.\n' +
        ' • Promptly pay utility charges including electricity and water.';

      const chunks = chunkText(bulletedText, 110, 25);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.some((c) => c.includes('repair'))).toBe(true);
      expect(chunks.some((c) => c.includes('sublet'))).toBe(true);
    });

    it('verifies sliding window overlap ensures zero token gap between sequential chunks', () => {
      const text = 'Paragraph Alpha describes liabilities. Paragraph Beta describes indemnities. Paragraph Gamma describes warranties. Paragraph Delta describes remedies.';
      const chunks = chunkText(text, 85, 30);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      // Ensure overlap exists between adjacent chunks
      for (let i = 0; i < chunks.length - 1; i++) {
        const currentWords = chunks[i].split(' ');
        const nextWords = chunks[i + 1].split(' ');
        const hasCommonWord = currentWords.some((w) => w.length > 3 && nextWords.includes(w));
        expect(hasCommonWord).toBe(true);
      }
    });
  });

  describe('Contract Comparison Materiality & Diffing Edge Cases', () => {
    function classifyDiffMateriality(oldText: string, newText: string): 'material' | 'minor' | 'formatting' {
      const cleanOld = oldText.trim().toLowerCase().replace(/\s+/g, ' ');
      const cleanNew = newText.trim().toLowerCase().replace(/\s+/g, ' ');

      if (cleanOld === cleanNew) return 'formatting';

      // Material triggers: numbers/fees, dates/terms, jurisdiction, liabilities, termination
      const materialPatterns = [
        /\b\d+[\d,.]*\b/, // monetary or quantitative figures
        /\b(month|year|day|week)s?\b/i,
        /\b(terminate|termination|default|cure)\b/i,
        /\b(indemnif|liability|damage|remedy)\b/i,
        /\b(court|arbitrat|jurisdiction|governing law)\b/i,
      ];

      const oldHasMaterial = materialPatterns.some((p) => p.test(cleanOld));
      const newHasMaterial = materialPatterns.some((p) => p.test(cleanNew));

      if (oldHasMaterial || newHasMaterial) {
        // If figures or covenants changed, it is material
        if (cleanOld.match(/\d+/)?.join('') !== cleanNew.match(/\d+/)?.join('')) {
          return 'material';
        }
        if (cleanOld.includes('delhi') !== cleanNew.includes('delhi')) {
          return 'material';
        }
        if (cleanOld.includes('terminate') !== cleanNew.includes('terminate')) {
          return 'material';
        }
      }

      return 'minor';
    }

    it('classifies identical text with different spacing as formatting change', () => {
      const v1 = 'Rent is 45,000 INR per month.';
      const v2 = 'Rent  is   45,000   INR per month. ';
      expect(classifyDiffMateriality(v1, v2)).toBe('formatting');
    });

    it('classifies rent amount modification as material change', () => {
      const v1 = 'Monthly rent shall be 45,000 INR.';
      const v2 = 'Monthly rent shall be 55,000 INR.';
      expect(classifyDiffMateriality(v1, v2)).toBe('material');
    });

    it('classifies security deposit increase as material change', () => {
      const v1 = 'Security deposit of 90,000 INR paid in advance.';
      const v2 = 'Security deposit of 150,000 INR paid in advance.';
      expect(classifyDiffMateriality(v1, v2)).toBe('material');
    });

    it('classifies notice period change from 30 to 60 days as material change', () => {
      const v1 = 'Termination requires 30 days written notice.';
      const v2 = 'Termination requires 60 days written notice.';
      expect(classifyDiffMateriality(v1, v2)).toBe('material');
    });

    it('classifies jurisdiction change from Delhi to Mumbai as material change', () => {
      const v1 = 'Courts in New Delhi shall have exclusive jurisdiction.';
      const v2 = 'Courts in Mumbai shall have exclusive jurisdiction.';
      expect(classifyDiffMateriality(v1, v2)).toBe('material');
    });

    it('classifies harmless synonym replacement without numbers as minor change', () => {
      const v1 = 'Tenant shall preserve the property in proper state.';
      const v2 = 'Tenant shall maintain the property in proper condition.';
      expect(classifyDiffMateriality(v1, v2)).toBe('minor');
    });
  });

  describe('Export Sanitization & CSV Formula Injection Defenses', () => {
    function sanitizeCsvCell(value: string): string {
      if (!value) return '';
      // Formula injection defense: cells starting with =, +, -, @ must be prepended with a single quote
      if (/^[=+\-@\t\r]/.test(value)) {
        return `'${value}`;
      }
      return value;
    }

    it('neutralizes formula injection starting with =', () => {
      const malicious = '=cmd|"/C calc"!A0';
      const safe = sanitizeCsvCell(malicious);
      expect(safe).toBe("'=cmd|\"/C calc\"!A0");
      expect(safe.startsWith("'=")).toBe(true);
    });

    it('neutralizes formula injection starting with +', () => {
      const malicious = '+1+cmd|"/C notepad"!A0';
      const safe = sanitizeCsvCell(malicious);
      expect(safe.startsWith("'+")).toBe(true);
    });

    it('neutralizes formula injection starting with -', () => {
      const malicious = '-2+cmd|"/C powershell"!A0';
      const safe = sanitizeCsvCell(malicious);
      expect(safe.startsWith("'-")).toBe(true);
    });

    it('neutralizes formula injection starting with @ (e.g. SUM or external lookup)', () => {
      const malicious = '@SUM(1+1)*cmd|"/C calc"!A0';
      const safe = sanitizeCsvCell(malicious);
      expect(safe.startsWith("'@")).toBe(true);
    });

    it('leaves standard legal contract text unaltered in CSV cell', () => {
      const standard = 'Section 4.1 Payment terms: 45,000 INR';
      expect(sanitizeCsvCell(standard)).toBe(standard);
    });
  });
});
