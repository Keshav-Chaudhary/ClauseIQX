# 10 — Code Quality, Architecture & Maintainability
## Product: ClauseIQX — Legal Document Intelligence

**Version:** 2.0  
**Audit Reference:** [CODE_QUALITY.md](./CODE_QUALITY.md)  
**Status:** Clean Typecheck, 0 Lint Errors, Strict Monorepo Architecture  

---

## 1. Architectural Principles

ClauseIQX follows clean architecture principles designed for maintainability, testability, and enterprise extensibility:

1. **Monorepo Workspaces:** Clean separation between web client (`apps/web`), backend API (`apps/api`), background worker (`workers/document-processing`), and shared libraries (`packages/*`).
2. **Provider Abstraction Layer:** Business logic never binds directly to third-party vendor SDKs. The AI layer is isolated behind provider contracts (`LLMProvider`, `EmbeddingProvider`, `OCRProvider`, `MalwareScanner`, `ObjectStorage`).
3. **End-to-End Type Safety:** TypeScript 5.4 in strict mode shared across client and server via `@clauseiqx/shared-types`.
4. **Runtime Schema Validation:** Every incoming API payload, query param, and configuration setting is validated via Zod schemas before execution.

---

## 2. Monorepo Package Boundaries

```text
ClauseIQX Monorepo
├── apps/
│   ├── api/                  # Express 5 application, route handlers, middleware
│   └── web/                  # Next.js 16 App Router frontend, UI design system
├── packages/
│   ├── ai/                   # Provider interfaces, OpenAI, Tesseract & mock adapters
│   ├── logger/               # Structured JSON logging (pino/winston interface)
│   ├── security/             # PBKDF2 hashing, prompt defense, MIME checks, rate limits
│   └── shared-types/         # Domain entities, DTOs, API contracts, Zod schemas
└── workers/
    └── document-processing/  # Async ingestion, OCR, chunking, and embeddings boundary
```

---

## 3. Strict Provider Abstraction Pattern

Direct vendor dependencies are strictly forbidden in core domain services. Adapters implement standardized interfaces:

```typescript
// Provider interface contract
export interface LLMProvider {
  generateStructured<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T>;
  streamStructured(prompt: string, onChunk: (chunk: string) => void): Promise<string>;
  classify(text: string, categories: string[]): Promise<string>;
}
```

This ensures the entire application can be tested via deterministic mock adapters without spending API tokens or exposing network dependencies during CI runs.

---

## 4. Code Quality Enforcement

- **TypeScript Strict Mode:** Enforces `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, and `strictFunctionTypes`.
- **ESLint Standard:** Continuous linting passes with 0 errors and 0 warnings.
- **Dependency Overrides:** Secure override resolution for indirect dependencies (`qs` 6.16.0) ensuring zero high/critical CVEs.
