import {
  LLMProvider,
  EmbeddingProvider,
  OCRProvider,
} from './interfaces';
import {
  MockLLMProvider,
  MockEmbeddingProvider,
  MockOCRProvider,
} from './mocks';
import { OpenAILLMProvider } from './openai-llm-provider';
import { OpenAIEmbeddingProvider } from './openai-embedding-provider';
import { TesseractOCRProvider } from './tesseract-ocr-provider';

/**
 * Factory functions to create provider instances based on configuration.
 * Allows switching between mock and real implementations via environment variables.
 */

export function createLLMProvider(provider: string): LLMProvider {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAILLMProvider();
    case 'mock':
    default:
      return new MockLLMProvider();
  }
}

export function createEmbeddingProvider(provider: string): EmbeddingProvider {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIEmbeddingProvider();
    case 'mock':
    default:
      return new MockEmbeddingProvider();
  }
}

export function createOCRProvider(provider: string): OCRProvider {
  switch (provider.toLowerCase()) {
    case 'tesseract':
      return new TesseractOCRProvider();
    case 'mock':
    default:
      return new MockOCRProvider();
  }
}
