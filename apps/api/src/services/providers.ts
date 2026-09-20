import {
  ObjectStorage,
  MockObjectStorage,
  MalwareScanner,
  MockMalwareScanner,
  OCRProvider,
  EmbeddingProvider,
  LLMProvider,
  createLLMProvider,
  createEmbeddingProvider,
  createOCRProvider,
} from '@clauseiqx/ai';
import { loadConfig } from '../config';

// loadConfig also loads a local .env before providers are instantiated.
const config = loadConfig();

export const globalStorage: ObjectStorage = new MockObjectStorage();
export const globalMalwareScanner: MalwareScanner = new MockMalwareScanner();
export const globalOCRProvider: OCRProvider = createOCRProvider(config.OCR_PROVIDER);
export const globalEmbeddingProvider: EmbeddingProvider = createEmbeddingProvider(config.EMBEDDING_PROVIDER);
export const globalLLMProvider: LLMProvider = createLLMProvider(config.LLM_PROVIDER);
