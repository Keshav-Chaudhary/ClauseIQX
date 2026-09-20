import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataStore } from '../src/services/store';

describe('Phase 5: Pipeline Security Integration Tests (malware + MIME mismatch)', () => {
  beforeEach(() => {
    dataStore.clear();
    vi.clearAllMocks();
  });

  describe('Test 1 — Infected file rejection', () => {
    it('rejects infected file before any LLM/embedding call is made', async () => {
      // Import after setup to ensure fresh mocks
      const { ingestDocument } = await import('../src/services/documents/ingestion');
      const { globalMalwareScanner, globalEmbeddingProvider } = await import('../src/services/providers');

      // Spy on the real global malware scanner
      const scanSpy = vi.spyOn(globalMalwareScanner, 'scan').mockResolvedValueOnce({
        isClean: false,
        threatName: 'EICAR-Test-File',
      });

      // Spy on the embedding provider to verify it's never called
      const embedSpy = vi.spyOn(globalEmbeddingProvider, 'embed');

      const infectedBuffer = Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'),
        Buffer.from('\n%%EOF'),
      ]);

      try {
        await ingestDocument({
          projectId: 'test-project',
          userId: 'test-user',
          filename: 'infected.pdf',
          mediaType: 'application/pdf',
          fileBuffer: infectedBuffer,
          requestId: 'test-req',
        });
        expect.fail('Should have thrown an error for infected file');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/threat|Malware detected/i);
      }

      // Verify scanner was called
      expect(scanSpy).toHaveBeenCalledTimes(1);

      // Verify embedding provider was NEVER called (no partial processing)
      expect(embedSpy).not.toHaveBeenCalled();

      // Verify document status is FAILED
      const documents = dataStore.findDocumentsForProject('test-project', true);
      expect(documents).toHaveLength(1);
      expect(documents[0].status).toBe('FAILED');
      expect(documents[0].scan_status).toBe('INFECTED');

      // Verify zero chunks created (document was soft-deleted)
      const version = dataStore.getLatestDocumentVersion(documents[0].id);
      expect(version).toBeNull();

      // Verify no chunks exist for this document
      if (version) {
        const chunks = dataStore.findChunksForVersion(version.id);
        expect(chunks).toHaveLength(0);
      }

      // Cleanup
      scanSpy.mockRestore();
      embedSpy.mockRestore();
    });
  });

  describe('Test 2 — MIME mismatch rejection', () => {
    it('rejects file with .pdf extension but PNG content (magic byte mismatch)', async () => {
      const { ingestDocument } = await import('../src/services/documents/ingestion');

      // PNG magic bytes (\x89PNG) but declared as PDF
      const pngDisguisedAsPdf = Buffer.concat([
        Buffer.from('\x89PNG\r\n\x1a\n'), // PNG magic bytes
        Buffer.from('fake png content'),
      ]);

      try {
        await ingestDocument({
          projectId: 'test-project',
          userId: 'test-user',
          filename: 'trojan.pdf',
          mediaType: 'application/pdf', // Declared MIME is PDF
          fileBuffer: pngDisguisedAsPdf,
          requestId: 'test-req',
        });
        expect.fail('Should have thrown an error for MIME mismatch');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // The error message should indicate a format/security issue
        expect((error as Error).message).toMatch(/Unsupported file format|security|magic byte/i);
      }

      // Verify no document reaches PROCESSING status
      const documents = dataStore.findDocumentsForProject('test-project', true);
      // Should have a FAILED document, not PROCESSING
      expect(documents.every(doc => doc.status !== 'PROCESSING')).toBe(true);
    });

    it('rejects file with .pdf extension but JPEG content', async () => {
      const { ingestDocument } = await import('../src/services/documents/ingestion');

      // JPEG magic bytes (FF D8 FF) but declared as PDF
      const jpegDisguisedAsPdf = Buffer.concat([
        Buffer.from('\xFF\xD8\xFF'), // JPEG magic bytes
        Buffer.from('fake jpeg content'),
      ]);

      try {
        await ingestDocument({
          projectId: 'test-project',
          userId: 'test-user',
          filename: 'trojan.pdf',
          mediaType: 'application/pdf',
          fileBuffer: jpegDisguisedAsPdf,
          requestId: 'test-req',
        });
        expect.fail('Should have thrown an error for MIME mismatch');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // The error message should indicate a format/security issue
        expect((error as Error).message).toMatch(/do not match|security|magic byte/i);
      }
    });
  });
});
