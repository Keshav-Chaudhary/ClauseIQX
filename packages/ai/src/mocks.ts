import * as crypto from 'crypto';
import { z } from 'zod';
import {
  LLMProvider,
  LLMPromptPayload,
  StructuredAnswer,
  StructuredClaim,
  EmbeddingProvider,
  OCRProvider,
  OCRExtractResult,
  MalwareScanner,
  MalwareScanResult,
  ObjectStorage,
  PutObjectResult,
} from './interfaces';

// ==========================================
// 1. MOCK LLM PROVIDER
// ==========================================

export class MockLLMProvider implements LLMProvider {
  private modelName: string;

  constructor(modelName = 'mock-gpt-4o-mini') {
    this.modelName = modelName;
  }

  getModelName(): string {
    return this.modelName;
  }

  async classify(
    input: string,
    categories: string[]
  ): Promise<{ category: string; confidence: number }> {
    const lower = input.toLowerCase();

    // High stakes prediction detection
    if (
      lower.includes('will i win') ||
      lower.includes('should i sign') ||
      lower.includes('is this legal') ||
      lower.includes('can i sue') ||
      lower.includes('is this illegal')
    ) {
      return { category: 'high_stakes_advice', confidence: 0.98 };
    }

    if (categories.length > 0) {
      const match = categories.find((cat) => lower.includes(cat.toLowerCase()));
      if (match) {
        return { category: match, confidence: 0.9 };
      }
      return { category: categories[0], confidence: 0.75 };
    }

    return { category: 'informational', confidence: 0.85 };
  }

  async generateStructured<T>(
    prompt: LLMPromptPayload,
    schema: z.ZodType<T>
  ): Promise<StructuredAnswer<T>> {
    const userPromptLower = prompt.userPrompt.toLowerCase();
    const evidence = prompt.evidence || [];

    // 1. High-Stakes / Outcome Prediction check
    if (
      userPromptLower.includes('will i win') ||
      userPromptLower.includes('is this illegal') ||
      userPromptLower.includes('should i sign')
    ) {
      const claims: StructuredClaim[] = evidence.map((e) => ({
        text: `The document contains terms regarding: ${e.section_title || 'contract clause'}.`,
        source_chunk_ids: [e.chunk_id],
        confidence: 'high',
      }));

      return {
        answer:
          'This tool provides legal information, not a legal opinion or outcome prediction. ' +
          'Based on the document text retrieved, the agreement sets out specific terms, but whether you would prevail in a dispute depends on factual context and applicable jurisdiction law. ' +
          'Consider reviewing these specific points with a qualified legal professional.',
        claims,
        limitations: [
          'The system cannot predict litigation outcomes or determine enforceability.',
          'Jurisdiction-specific statutory protections may override contract terms.',
        ],
        needs_professional_review: true,
      };
    }

    // 2. Insufficient Evidence / Abstention check
    if (evidence.length === 0) {
      return {
        answer:
          "I can't reliably answer that from the document alone. The retrieved sections do not contain information addressing this question.",
        claims: [],
        limitations: [
          'No matching document evidence was found for this query.',
          'Consult the full original document or a legal professional for questions outside this text.',
        ],
        needs_professional_review: false,
      };
    }

    // 3. Grounded Answer Generation
    const claims: StructuredClaim[] = evidence.map((e) => ({
      text: `Evidence excerpt from ${e.section_title || 'document'}: "${e.text.substring(0, 100)}..."`,
      source_chunk_ids: [e.chunk_id],
      confidence: 'high',
    }));

    const responseAnswer =
      `Based on the provided document provisions (${evidence.map((e) => e.section_title || 'section').join(', ')}), ` +
      `the document states relevant terms as detailed in the cited sections.`;

    // Attempt to synthesize mock structured data if a schema was supplied
    let mockData: T | undefined = undefined;
    try {
      // Create a sensible empty or populated object if schema accepts it
      mockData = schema.parse({}) as T;
    } catch {
      // Schema may require specific fields; callers can supply custom mock payloads if needed
      mockData = undefined;
    }

    return {
      answer: responseAnswer,
      data: mockData,
      claims,
      limitations: [
        'Analysis is limited strictly to the retrieved document excerpts.',
      ],
      needs_professional_review: false,
    };
  }

  async streamStructured<T>(
    prompt: LLMPromptPayload,
    schema: z.ZodType<T>,
    onChunk: (partialText: string) => void
  ): Promise<StructuredAnswer<T>> {
    const finalAnswer = await this.generateStructured(prompt, schema);
    const words = finalAnswer.answer.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
    }
    return finalAnswer;
  }
}

// ==========================================
// 2. MOCK EMBEDDING PROVIDER
// ==========================================

export class MockEmbeddingProvider implements EmbeddingProvider {
  private dimension: number;
  private modelName: string;

  constructor(dimension = 1536, modelName = 'mock-text-embedding-3-small') {
    this.dimension = dimension;
    this.modelName = modelName;
  }

  getDimensions(): number {
    return this.dimension;
  }

  getModelName(): string {
    return this.modelName;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => {
      // Create deterministic vector seeded by sha256 of text
      const hash = crypto.createHash('sha256').update(text).digest();
      const vector: number[] = new Array(this.dimension);
      let norm = 0;

      for (let i = 0; i < this.dimension; i++) {
        // Pseudo-random float between -1.0 and 1.0 from hash bytes
        const byte = hash[i % hash.length];
        const val = (byte / 128.0) - 1.0;
        vector[i] = val;
        norm += val * val;
      }

      // Normalize vector to unit length
      const sqrtNorm = Math.sqrt(norm) || 1.0;
      for (let i = 0; i < this.dimension; i++) {
        vector[i] = vector[i] / sqrtNorm;
      }

      return vector;
    });
  }
}

// ==========================================
// 3. MOCK OCR PROVIDER
// ==========================================

export class MockOCRProvider implements OCRProvider {
  getProviderName(): string {
    return 'mock-ocr-provider';
  }

  async extract(fileBuffer: Buffer, _mimeType: string): Promise<OCRExtractResult> {
    const textContent = fileBuffer.toString('utf-8');

    // Split simulated document into pages
    const pageSegments = textContent.split(/\f|\n--- Page \d+ ---\n/);
    const pages = pageSegments.map((segmentText, index) => ({
      pageNumber: index + 1,
      text: segmentText.trim() || 'Simulated scanned legal text passage.',
      confidence: 0.98,
    }));

    return {
      text: textContent || 'Simulated legal document content.',
      pageCount: Math.max(pages.length, 1),
      pages,
      overallConfidence: 0.98,
    };
  }
}

// ==========================================
// 4. MOCK MALWARE SCANNER
// ==========================================

export class MockMalwareScanner implements MalwareScanner {
  // Standard EICAR test string signature for anti-malware verification
  private static readonly EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

  getScannerName(): string {
    return 'mock-malware-scanner';
  }

  async scan(fileBuffer: Buffer, filename: string): Promise<MalwareScanResult> {
    const fileContent = fileBuffer.toString('binary');
    const now = new Date().toISOString();

    // Check for standard test virus signature
    if (fileContent.includes(MockMalwareScanner.EICAR_SIGNATURE) || filename.includes('eicar')) {
      return {
        isClean: false,
        scanStatus: 'INFECTED',
        threatName: 'EICAR-Test-Signature',
        scannedBytes: fileBuffer.length,
        scanTimestamp: now,
      };
    }

    // Check for simulated malicious executable payload
    if (filename.endsWith('.exe') || filename.endsWith('.bat') || filename.endsWith('.sh')) {
      return {
        isClean: false,
        scanStatus: 'INFECTED',
        threatName: 'DisallowedExecutablePayload',
        scannedBytes: fileBuffer.length,
        scanTimestamp: now,
      };
    }

    return {
      isClean: true,
      scanStatus: 'CLEAN',
      scannedBytes: fileBuffer.length,
      scanTimestamp: now,
    };
  }
}

// ==========================================
// 5. MOCK OBJECT STORAGE
// ==========================================

export class MockObjectStorage implements ObjectStorage {
  private storage = new Map<string, { data: Buffer; contentType: string; sha256: string }>();

  getStorageProviderName(): string {
    return 'mock-object-storage';
  }

  async put(key: string, data: Buffer, contentType: string): Promise<PutObjectResult> {
    const sha256 = crypto.createHash('sha256').update(data).digest('hex');
    this.storage.set(key, { data, contentType, sha256 });
    return {
      key,
      byteSize: data.length,
      sha256,
      contentType,
    };
  }

  async get(key: string): Promise<Buffer> {
    const item = this.storage.get(key);
    if (!item) {
      throw new Error(`Object not found in storage: ${key}`);
    }
    return item.data;
  }

  async getAuthorizedDownload(key: string, expiresInSeconds: number): Promise<string> {
    if (!this.storage.has(key)) {
      throw new Error(`Object not found in storage: ${key}`);
    }
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    // Authorized private URL with expiration signature
    return `https://storage.clauseiqx.internal/download?key=${encodeURIComponent(key)}&token=${token}&expires=${expiresAt}`;
  }

  async delete(key: string): Promise<boolean> {
    // Idempotent deletion
    this.storage.delete(key);
    return true;
  }
}
