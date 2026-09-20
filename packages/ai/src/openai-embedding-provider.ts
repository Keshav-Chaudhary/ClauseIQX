import OpenAI from 'openai';
import { EmbeddingProvider } from './interfaces';

/**
 * OpenAI implementation of EmbeddingProvider.
 * Uses OpenAI embeddings API for text vectorization.
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;
  private dimensions: number;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.EMBEDDING_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key is required. Set EMBEDDING_API_KEY environment variable or pass apiKey parameter.');
    }
    
    this.client = new OpenAI({ apiKey: key });
    this.model = model || process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    
    // Set dimensions based on model
    if (this.model === 'text-embedding-3-small') {
      this.dimensions = 1536;
    } else if (this.model === 'text-embedding-3-large') {
      this.dimensions = 3072;
    } else {
      this.dimensions = 1536; // Default for older models
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    try {
      // Process in batches of 100 to respect API limits
      const batchSize = 100;
      const allEmbeddings: number[][] = [];

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
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI embedding generation failed: ${error.message}`);
      }
      throw new Error('Unknown error during OpenAI embedding generation');
    }
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModelName(): string {
    return this.model;
  }
}
