import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  MockLLMProvider,
  MockEmbeddingProvider,
  MockOCRProvider,
  MockMalwareScanner,
  MockObjectStorage,
} from '../src';

describe('AI Provider Abstractions & Mocks', () => {
  describe('MockLLMProvider', () => {
    const llm = new MockLLMProvider('test-llm');

    it('returns configured model name', () => {
      expect(llm.getModelName()).toBe('test-llm');
    });

    it('generates structured answers citing retrieved evidence', async () => {
      const prompt = {
        systemPrompt: 'System legal prompt',
        userPrompt: 'What is the termination period?',
        evidence: [
          {
            chunk_id: '11111111-1111-1111-1111-111111111111',
            text: 'Either party may terminate this agreement with 30 days written notice.',
            page_number: 4,
            section_title: 'Termination',
          },
        ],
      };

      const schema = z.object({
        notice_days: z.number().default(30),
      });

      const response = await llm.generateStructured(prompt, schema);
      expect(response.answer).toBeDefined();
      expect(response.claims.length).toBe(1);
      expect(response.claims[0].source_chunk_ids).toContain('11111111-1111-1111-1111-111111111111');
      expect(response.claims[0].confidence).toBe('high');
      expect(response.needs_professional_review).toBe(false);
    });

    it('abstains explicitly when evidence is insufficient', async () => {
      const prompt = {
        systemPrompt: 'System legal prompt',
        userPrompt: 'What is the penalty for early termination?',
        evidence: [], // No evidence available
      };

      const response = await llm.generateStructured(prompt, z.object({}));
      expect(response.answer).toContain("I can't reliably answer that from the document alone");
      expect(response.claims).toHaveLength(0);
      expect(response.limitations.length).toBeGreaterThan(0);
    });

    it('detects and reframes high-stakes legal outcome questions without dead-end refusal', async () => {
      const prompt = {
        systemPrompt: 'System legal prompt',
        userPrompt: 'Will I win if I sue my landlord over this clause?',
        evidence: [
          {
            chunk_id: '22222222-2222-2222-2222-222222222222',
            text: 'Landlord shall maintain heating systems.',
            page_number: 2,
            section_title: 'Maintenance',
          },
        ],
      };

      const response = await llm.generateStructured(prompt, z.object({}));
      expect(response.needs_professional_review).toBe(true);
      expect(response.answer).toContain('This tool provides legal information, not a legal opinion');
      expect(response.claims[0].source_chunk_ids).toContain('22222222-2222-2222-2222-222222222222');
    });

    it('streams structured responses chunk-by-chunk', async () => {
      const prompt = {
        systemPrompt: 'System',
        userPrompt: 'Summarize obligations',
        evidence: [
          {
            chunk_id: '33333333-3333-3333-3333-333333333333',
            text: 'Tenant shall pay rent on the first of each month.',
            page_number: 1,
          },
        ],
      };

      const chunks: string[] = [];
      const result = await llm.streamStructured(prompt, z.object({}), (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(result.answer).toBeDefined();
    });

    it('classifies user intent accurately', async () => {
      const classification = await llm.classify('Will I win this dispute?', ['summary', 'qa']);
      expect(classification.category).toBe('high_stakes_advice');
      expect(classification.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('MockEmbeddingProvider', () => {
    const embedder = new MockEmbeddingProvider(1536, 'test-embedder');

    it('returns embeddings with configured dimension and unit normalization', async () => {
      const vectors = await embedder.embed(['Standard lease obligation clause.']);
      expect(vectors).toHaveLength(1);
      expect(vectors[0]).toHaveLength(1536);

      // Verify unit length (magnitude ≈ 1.0)
      const magnitude = Math.sqrt(vectors[0].reduce((sum, v) => sum + v * v, 0));
      expect(magnitude).toBeCloseTo(1.0, 3);
    });
  });

  describe('MockOCRProvider', () => {
    const ocr = new MockOCRProvider();

    it('extracts text and page structure with confidence', async () => {
      const sampleDoc = Buffer.from('Page 1 Content\n\fPage 2 Content', 'utf-8');
      const result = await ocr.extract(sampleDoc, 'application/pdf');

      expect(result.pageCount).toBe(2);
      expect(result.pages[0].pageNumber).toBe(1);
      expect(result.pages[1].pageNumber).toBe(2);
      expect(result.overallConfidence).toBeGreaterThan(0.9);
    });
  });

  describe('MockMalwareScanner', () => {
    const scanner = new MockMalwareScanner();

    it('flags EICAR test string as infected', async () => {
      const eicar = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', 'utf-8');
      const result = await scanner.scan(eicar, 'test-eicar.txt');

      expect(result.isClean).toBe(false);
      expect(result.scanStatus).toBe('INFECTED');
      expect(result.threatName).toBe('EICAR-Test-Signature');
    });

    it('marks harmless text documents as clean', async () => {
      const normalDoc = Buffer.from('Standard non-disclosure agreement text.', 'utf-8');
      const result = await scanner.scan(normalDoc, 'contract.txt');

      expect(result.isClean).toBe(true);
      expect(result.scanStatus).toBe('CLEAN');
    });
  });

  describe('MockObjectStorage', () => {
    const storage = new MockObjectStorage();

    it('puts, gets, and generates authorized download links with expiration', async () => {
      const data = Buffer.from('Confidential legal contract file', 'utf-8');
      const putResult = await storage.put('docs/doc-123.pdf', data, 'application/pdf');

      expect(putResult.key).toBe('docs/doc-123.pdf');
      expect(putResult.byteSize).toBe(data.length);
      expect(putResult.sha256).toBeDefined();

      const retrieved = await storage.get('docs/doc-123.pdf');
      expect(retrieved.toString('utf-8')).toBe('Confidential legal contract file');

      const downloadUrl = await storage.getAuthorizedDownload('docs/doc-123.pdf', 300);
      expect(downloadUrl).toContain('token=');
      expect(downloadUrl).toContain('expires=');

      // Deletion is idempotent
      const deleted = await storage.delete('docs/doc-123.pdf');
      expect(deleted).toBe(true);

      const deletedAgain = await storage.delete('docs/doc-123.pdf');
      expect(deletedAgain).toBe(true);
    });
  });
});
