"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIEmbeddingProvider = void 0;
const openai_1 = __importDefault(require("openai"));
/**
 * OpenAI implementation of EmbeddingProvider.
 * Uses OpenAI embeddings API for text vectorization.
 */
class OpenAIEmbeddingProvider {
    client;
    model;
    dimensions;
    constructor(apiKey, model) {
        const key = apiKey || process.env.EMBEDDING_API_KEY;
        if (!key) {
            throw new Error('OpenAI API key is required. Set EMBEDDING_API_KEY environment variable or pass apiKey parameter.');
        }
        this.client = new openai_1.default({ apiKey: key });
        this.model = model || process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
        // Set dimensions based on model
        if (this.model === 'text-embedding-3-small') {
            this.dimensions = 1536;
        }
        else if (this.model === 'text-embedding-3-large') {
            this.dimensions = 3072;
        }
        else {
            this.dimensions = 1536; // Default for older models
        }
    }
    async embed(texts) {
        if (texts.length === 0) {
            return [];
        }
        try {
            // Process in batches of 100 to respect API limits
            const batchSize = 100;
            const allEmbeddings = [];
            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                const response = await this.client.embeddings.create({
                    model: this.model,
                    input: batch,
                });
                const batchEmbeddings = response.data.map((item) => item.embedding);
                allEmbeddings.push(...batchEmbeddings);
            }
            return allEmbeddings;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`OpenAI embedding generation failed: ${error.message}`);
            }
            throw new Error('Unknown error during OpenAI embedding generation');
        }
    }
    getDimensions() {
        return this.dimensions;
    }
    getModelName() {
        return this.model;
    }
}
exports.OpenAIEmbeddingProvider = OpenAIEmbeddingProvider;
//# sourceMappingURL=openai-embedding-provider.js.map