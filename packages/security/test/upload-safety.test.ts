import { describe, it, expect } from 'vitest';
import { processSafeUpload } from '../../../apps/api/src/middleware/upload-safety';
import { MockObjectStorage } from '@clauseiqx/ai';

describe('File Upload Safety & Storage Isolation (TRD §4.4)', () => {
  const storage = new MockObjectStorage();

  it('accepts valid PDF with proper magic bytes and stores in isolated quarantine', async () => {
    const validPdfBuffer = Buffer.from('%PDF-1.7\nSample legal agreement text for upload.');
    const result = await processSafeUpload(
      validPdfBuffer,
      'lease-agreement.pdf',
      'application/pdf',
      storage
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.upload.filename).toBe('lease-agreement.pdf');
      expect(result.upload.mediaType).toBe('application/pdf');
      expect(result.upload.byteSize).toBe(validPdfBuffer.length);
      expect(result.upload.sha256).toBeDefined();

      // Confirms storage key is isolated in quarantine/ outside web root
      expect(result.upload.storageObjectKey).toMatch(/^quarantine\/doc_[a-f0-9_]+\.pdf$/);

      // Verify the object is stored in private storage
      const stored = await storage.get(result.upload.storageObjectKey);
      expect(stored).toEqual(validPdfBuffer);
    }
  });

  it('rejects disallowed file extensions (.sh, .exe, .bat, .py)', async () => {
    const scriptBuffer = Buffer.from('#!/bin/bash\necho "exploit"');
    const result = await processSafeUpload(
      scriptBuffer,
      'payload.sh',
      'text/plain',
      storage
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(400);
      expect(JSON.stringify(result.error)).toContain("File extension '.sh' is not permitted");
    }
  });

  it('rejects renamed executables where magic bytes do not match declared PDF', async () => {
    // Renamed DOS/PE executable disguised as a PDF
    const fakePdfBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const result = await processSafeUpload(
      fakePdfBuffer,
      'disguised_malware.pdf',
      'application/pdf',
      storage
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(400);
      expect(JSON.stringify(result.error)).toContain('Executable files are prohibited');
    }
  });

  it('rejects files exceeding size limit', async () => {
    const oversizedBuffer = Buffer.alloc(100);
    const result = await processSafeUpload(
      oversizedBuffer,
      'large-contract.txt',
      'text/plain',
      storage,
      { maxSizeBytes: 50 } // 50 bytes limit
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(400);
      expect(JSON.stringify(result.error)).toContain('exceeds the limit');
    }
  });
});
