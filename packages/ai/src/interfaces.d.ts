import { z } from 'zod';
import { Confidence, ScanStatus } from '@clauseiqx/shared-types';
export interface EvidenceChunk {
    chunk_id: string;
    text: string;
    page_number?: number;
    section_title?: string;
}
export interface LLMPromptPayload {
    systemPrompt: string;
    userPrompt: string;
    evidence?: EvidenceChunk[];
    maxTokens?: number;
    temperature?: number;
}
export interface StructuredClaim {
    text: string;
    source_chunk_ids: string[];
    confidence: Confidence;
}
export interface StructuredAnswer<T = unknown> {
    answer: string;
    data?: T;
    claims: StructuredClaim[];
    limitations: string[];
    needs_professional_review: boolean;
}
export interface LLMProvider {
    /**
     * Generates a structured response strictly conforming to a given Zod schema
     * and evidence grounding rules.
     */
    generateStructured<T>(prompt: LLMPromptPayload, schema: z.ZodType<T>): Promise<StructuredAnswer<T>>;
    /**
     * Streams generation chunks while building towards the final structured result.
     */
    streamStructured<T>(prompt: LLMPromptPayload, schema: z.ZodType<T>, onChunk: (partialText: string) => void): Promise<StructuredAnswer<T>>;
    /**
     * Fast classification (e.g., high-stakes detection, intent routing).
     */
    classify(input: string, categories: string[]): Promise<{
        category: string;
        confidence: number;
    }>;
    getModelName(): string;
}
export interface EmbeddingProvider {
    embed(texts: string[]): Promise<number[][]>;
    getDimensions(): number;
    getModelName(): string;
}
export interface OCRPageResult {
    pageNumber: number;
    text: string;
    confidence: number;
}
export interface OCRExtractResult {
    text: string;
    pageCount: number;
    pages: OCRPageResult[];
    overallConfidence: number;
}
export interface OCRProvider {
    extract(fileBuffer: Buffer, mimeType: string): Promise<OCRExtractResult>;
    getProviderName(): string;
}
export interface MalwareScanResult {
    isClean: boolean;
    scanStatus: ScanStatus;
    threatName?: string;
    scannedBytes: number;
    scanTimestamp: string;
}
export interface MalwareScanner {
    scan(fileBuffer: Buffer, filename: string): Promise<MalwareScanResult>;
    getScannerName(): string;
}
export interface PutObjectResult {
    key: string;
    byteSize: number;
    sha256: string;
    contentType: string;
}
export interface ObjectStorage {
    /**
     * Securely puts an object into private storage. Key must not be guessable.
     */
    put(key: string, data: Buffer, contentType: string): Promise<PutObjectResult>;
    /**
     * Retrieves an object from private storage.
     */
    get(key: string): Promise<Buffer>;
    /**
     * Generates a short-lived authorized download link (never public or permanent).
     */
    getAuthorizedDownload(key: string, expiresInSeconds: number): Promise<string>;
    /**
     * Deletes an object. Idempotent.
     */
    delete(key: string): Promise<boolean>;
    getStorageProviderName(): string;
}
//# sourceMappingURL=interfaces.d.ts.map