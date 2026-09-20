# 08 — Testing, Quality Assurance & Verification
## Product: ClauseIQX — Legal Document Intelligence

**Version:** 2.0  
**Audit Reference:** [TESTING.md](./TESTING.md)  
**Status:** 25 Test Files Passed, 175+ Unit & Integration Tests  

---

## 1. Quality Strategy

ClauseIQX implements a rigorous multi-tier testing pipeline across monorepo packages and applications:

```text
┌────────────────────────────────────────────────────────┐
│                   Test Pipeline                        │
├────────────────────────────────────────────────────────┤
│ 1. Static Type Analysis: tsc --noEmit across 8 packages│
│ 2. ESLint Static Analysis: 0 errors, 0 warnings        │
│ 3. Secret Scanner: Pattern analysis on all repo files  │
│ 4. Unit & Security Tests: Ingestion, Auth, RAG, UPL    │
│ 5. Integration Tests: Multi-turn Q&A, Redline Diffing  │
│ 6. Real-Provider Smoke Test: Opt-in OpenAI/Tesseract   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Test Execution Matrix

| Test Suite | Framework | Target Areas | Command |
|---|---|---|---|
| **Unit & Integration** | Vitest 5.0 | Ingestion safety, chunking, citation validation, Q&A, auth, comparisons, exports | `npm test` |
| **Code Coverage** | Vitest V8 | Detailed line/branch coverage reporting | `npm run test:coverage` |
| **Static Typing** | TypeScript 5.4 | Strict typing across web, API, worker, and all packages | `npm run typecheck` |
| **Lint & Formatting** | ESLint 8.57 | Code consistency, import hygiene, hook rules | `npm run lint` |
| **Secret Scanning** | Custom Ts-Node | Regex scanner detecting accidental credential/key commits | `npm run scan:secrets` |
| **Live AI Smoke Test**| Custom Ts-Node | Disposable account end-to-end upload, analysis, and cited Q&A | `npm run smoke:real-ai` |

---

## 3. Key Test Coverage Areas

### 3.1 Document Ingestion & Malware Scanning
- **File:** `apps/api/test/document-ingestion.test.ts`
- Tests validation of declared vs. actual magic bytes (PDF, DOCX, TXT, images).
- Verifies rejection of oversized files, corrupted payloads, and unrecognized MIME types.
- Verifies quarantine lifecycle and transition to active processing.

### 3.2 Evidence Grounding & Q&A Guardrails
- **File:** `apps/api/test/qa.test.ts`
- Tests grounding of answers within retrieved document chunks.
- Verifies automatic abstention when evidence is insufficient or irrelevant.
- Tests high-stakes reframing for questions asking for legal advice (e.g., *"Should I sign?"*).
- Tests preservation of exact page number and passage snippet in returned citations.

### 3.3 Prompt Injection Defense & Pipeline Security
- **File:** `apps/api/test/pipeline-security.test.ts`
- Tests isolation of document text within `<untrusted_document_evidence>` boundary tags.
- Verifies that jailbreak instructions embedded inside document bodies do not alter system instructions.
- Tests resistance to tenant boundary bypass and path traversal.

### 3.4 Contract Comparison & Materiality Classification
- **File:** `apps/api/test/comparison.test.ts`
- Tests redline diff generation between two document versions.
- Verifies dual-sided citation mapping (Document A vs. Document B).
- Validates classification into material, minor, and formatting changes.

---

## 4. Running the Tests Locally

```powershell
# Run the complete test suite
npm test

# Run tests with coverage
npm run test:coverage

# Run static type checking
npm run typecheck

# Run linting
npm run lint

# Run secret scanning
npm run scan:secrets

# Run focused tests
npx vitest run apps/api/test/document-ingestion.test.ts
npx vitest run apps/api/test/qa.test.ts
```
