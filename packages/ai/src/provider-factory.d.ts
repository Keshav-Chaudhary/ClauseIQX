import { LLMProvider, EmbeddingProvider, OCRProvider } from './interfaces';
/**
 * Factory functions to create provider instances based on configuration.
 * Allows switching between mock and real implementations via environment variables.
 */
export declare function createLLMProvider(provider: string): LLMProvider;
export declare function createEmbeddingProvider(provider: string): EmbeddingProvider;
export declare function createOCRProvider(provider: string): OCRProvider;
//# sourceMappingURL=provider-factory.d.ts.map