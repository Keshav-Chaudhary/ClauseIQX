import { z } from 'zod';
import { LLMProvider, LLMPromptPayload, StructuredAnswer, EmbeddingProvider, OCRProvider, OCRExtractResult, MalwareScanner, MalwareScanResult, ObjectStorage, PutObjectResult } from './interfaces';
export declare class MockLLMProvider implements LLMProvider {
    private modelName;
    constructor(modelName?: string);
    getModelName(): string;
    classify(input: string, categories: string[]): Promise<{
        category: string;
        confidence: number;
    }>;
    generateStructured<T>(prompt: LLMPromptPayload, schema: z.ZodType<T>): Promise<StructuredAnswer<T>>;
    streamStructured<T>(prompt: LLMPromptPayload, schema: z.ZodType<T>, onChunk: (partialText: string) => void): Promise<StructuredAnswer<T>>;
}
export declare class MockEmbeddingProvider implements EmbeddingProvider {
    private dimension;
    private modelName;
    constructor(dimension?: number, modelName?: string);
    getDimensions(): number;
    getModelName(): string;
    embed(texts: string[]): Promise<number[][]>;
}
export declare class MockOCRProvider implements OCRProvider {
    getProviderName(): string;
    extract(fileBuffer: Buffer, _mimeType: string): Promise<OCRExtractResult>;
}
export declare class MockMalwareScanner implements MalwareScanner {
    private static readonly EICAR_SIGNATURE;
    getScannerName(): string;
    scan(fileBuffer: Buffer, filename: string): Promise<MalwareScanResult>;
}
export declare class MockObjectStorage implements ObjectStorage {
    private storage;
    getStorageProviderName(): string;
    put(key: string, data: Buffer, contentType: string): Promise<PutObjectResult>;
    get(key: string): Promise<Buffer>;
    getAuthorizedDownload(key: string, expiresInSeconds: number): Promise<string>;
    delete(key: string): Promise<boolean>;
}
//# sourceMappingURL=mocks.d.ts.map