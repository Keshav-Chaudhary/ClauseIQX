import { loadConfig } from '../apps/api/src/config';

const config = loadConfig();
const env = {
  DATA_STORE: config.DATA_STORE,
  DATABASE_URL: config.DATABASE_URL || '',
  LLM_PROVIDER: config.LLM_PROVIDER,
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  EMBEDDING_PROVIDER: config.EMBEDDING_PROVIDER,
  EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY || '',
  OCR_PROVIDER: config.OCR_PROVIDER,
};

const errors: string[] = [];

if (env.DATA_STORE === 'postgres' && !env.DATABASE_URL) {
  errors.push('DATA_STORE=postgres requires DATABASE_URL to be set.');
}

if (env.LLM_PROVIDER === 'openai' && !env.LLM_API_KEY) {
  errors.push('LLM_PROVIDER=openai requires LLM_API_KEY to be set.');
}

if (env.EMBEDDING_PROVIDER === 'openai' && !env.EMBEDDING_API_KEY) {
  errors.push('EMBEDDING_PROVIDER=openai requires EMBEDDING_API_KEY to be set.');
}

if (env.OCR_PROVIDER === 'tesseract') {
  // Tesseract.js is bundled and does not require a secret key, but the component is intentionally
  // opt-in and should not silently be treated as a valid live OCR path without the provider flag.
}

if (errors.length > 0) {
  console.error('[runtime-env] Invalid runtime configuration:');
  for (const error of errors) {
    console.error(` - ${error}`);
  }
  process.exit(1);
}

console.log('[runtime-env] OK');
console.log(JSON.stringify({
  mode: env.DATA_STORE,
  llm: env.LLM_PROVIDER,
  embedding: env.EMBEDDING_PROVIDER,
  ocr: env.OCR_PROVIDER,
  database: env.DATABASE_URL ? 'configured' : 'not-configured',
}, null, 2));
