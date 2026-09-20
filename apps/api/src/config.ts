import { z } from 'zod';

/**
 * Loads local development configuration without replacing variables injected by
 * the deployment platform. Node's native loader keeps this package dependency
 * free and is available in the documented Node 20+ runtime.
 */
function loadLocalEnvironment(): void {
  // Test suites set their own isolated environment and must never attempt to
  // contact services configured in a developer's local .env file.
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || process.env.VITEST) return;

  try {
    process.loadEnvFile('.env');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  }
}

loadLocalEnvironment();

export const AppConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  DATA_STORE: z.enum(['memory', 'postgres']).default('memory'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  LLM_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
  EMBEDDING_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
  OCR_PROVIDER: z.enum(['mock', 'tesseract']).default('mock'),
  MALWARE_SCANNER: z.string().default('mock'),
  STORAGE_PROVIDER: z.string().default('mock'),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export function loadConfig(): AppConfig {
  return AppConfigSchema.parse(process.env);
}
