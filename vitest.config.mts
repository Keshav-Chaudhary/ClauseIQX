import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
      ['**/apps/web/**', 'jsdom'],
    ],
    setupFiles: ['./tests/setup-dom.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: {
      '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
      '@clauseiqx/ai': fileURLToPath(new URL('./packages/ai/src/index.ts', import.meta.url)),
      '@clauseiqx/logger': fileURLToPath(new URL('./packages/logger/src/index.ts', import.meta.url)),
      '@clauseiqx/security': fileURLToPath(new URL('./packages/security/src/index.ts', import.meta.url)),
      '@clauseiqx/shared-types': fileURLToPath(new URL('./packages/shared-types/src/index.ts', import.meta.url)),
    },
  },
});
