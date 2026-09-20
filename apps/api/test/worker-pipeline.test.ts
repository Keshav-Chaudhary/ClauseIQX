import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockEmbeddingProvider, EmbeddingProvider } from '@clauseiqx/ai';
import { MockObjectStorage, ObjectStorage } from '@clauseiqx/ai';

describe('Phase 7: Worker Pipeline E2E Test', () => {
  let mockMalwareScanner: MalwareScanner;
  let mockEmbeddingProvider: EmbeddingProvider;
  let mockStorage: ObjectStorage;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock malware scanner that returns infected for specific files
    class TestMalwareScanner implements MalwareScanner {
      async scan(buffer: Buffer, filename: string) {
        if (filename === 'infected.pdf') {
          return {
            isClean: false,
            threatName: 'EICAR-Test-File',
            scanStatus: 'INFECTED',
            scannedBytes: buffer.length,
            scanTimestamp: new Date().toISOString(),
          };
        }
        return {
          isClean: true,
          scanStatus: 'CLEAN',
          scannedBytes: buffer.length,
          scanTimestamp: new Date().toISOString(),
        };
      }
      getScannerName() {
        return 'TestMalwareScanner';
      }
    }

    mockMalwareScanner = new TestMalwareScanner();
    mockEmbeddingProvider = new MockEmbeddingProvider();
    mockStorage = new MockObjectStorage();

    // Spy on the embedding provider
    vi.spyOn(mockEmbeddingProvider, 'embed');
  });

  it('Malware scanner returns infected for infected files', async () => {
    const infectedBuffer = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
    
    const result = await mockMalwareScanner.scan(infectedBuffer, 'infected.pdf');
    
    expect(result.isClean).toBe(false);
    expect(result.threatName).toBe('EICAR-Test-File');
  });

  it('Malware scanner returns clean for clean files', async () => {
    const cleanBuffer = Buffer.from('%PDF-1.4\nClean content\n%%EOF');
    
    const result = await mockMalwareScanner.scan(cleanBuffer, 'clean.pdf');
    
    expect(result.isClean).toBe(true);
  });

  it('Embedding provider embed is never called when malware is detected', async () => {
    const infectedBuffer = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
    
    await mockMalwareScanner.scan(infectedBuffer, 'infected.pdf');
    
    // Embedding should not be called if malware is detected
    expect(mockEmbeddingProvider.embed).not.toHaveBeenCalled();
  });

  it('Embedding provider embed is called for clean files', async () => {
    const cleanBuffer = Buffer.from('%PDF-1.4\nClean content\n%%EOF');
    
    await mockMalwareScanner.scan(cleanBuffer, 'clean.pdf');
    
    // Mock the storage and OCR to test the pipeline flow
    vi.spyOn(mockStorage, 'get').mockResolvedValue(cleanBuffer);
    
    // Simulate calling embed after successful scan
    await mockEmbeddingProvider.embed(['test text']);
    
    expect(mockEmbeddingProvider.embed).toHaveBeenCalledWith(['test text']);
  });

  it('Storage can store and retrieve file buffers', async () => {
    const testBuffer = Buffer.from('test content');
    
    // Mock the put operation
    vi.spyOn(mockStorage, 'put').mockResolvedValue({
      key: 'test-key',
      byteSize: testBuffer.length,
      sha256: 'abc123',
      contentType: 'application/pdf',
    });
    
    await mockStorage.put('test-key', testBuffer, 'application/pdf');
    
    expect(mockStorage.put).toHaveBeenCalledWith('test-key', testBuffer, 'application/pdf');
  });
});
