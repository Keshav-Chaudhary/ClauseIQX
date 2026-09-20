import { EmbeddingProvider } from './interfaces';
/**
 * OpenAI implementation of EmbeddingProvider.
 * Uses OpenAI embeddings API for text vectorization.
 */
export declare class OpenAIEmbeddingProvider implements EmbeddingProvider {
    private client;
    private model;
    private dimensions;
    constructor(apiKey?: string, model?: string);
    embed(texts: string[]): Promise<number[][]>;
    getDimensions(): number;
    getModelName(): string;
}
//# sourceMappingURL=openai-embedding-provider.d.ts.map