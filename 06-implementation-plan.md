# Implementation Plan
## Product: ClauseIQX

**Version:** 2.0 (Final Merged)
**Goal:** Production-quality MVP suitable for a hackathon/demo, with a credible path to real-world hardening.

---

## 1. Delivery Strategy

Build in vertical slices — each phase ships working, testable software end-to-end, rather than finishing an entire layer (backend/frontend/AI) before integrating. Recommended order:

1. Foundation & security scaffolding
2. Identity, projects, authorization
3. Secure document ingestion
4. Document normalization & RAG
5. Document analysis
6. Q&A
7. Contract comparison
8. Lawyer preparation
9. Export & data controls
10. UI/UX & accessibility hardening
11. AI evaluation
12. Security hardening
13. Observability
14. Launch

Every phase ends with working software, passing tests, and an updated Definition of Done checklist (§9).

---

## 2. Phase 0 — Architecture & Repository Setup (Week 1)

**Deliverables:** monorepo with clearly separated frontend/backend/worker packages; TypeScript linting, formatting, type checking, pre-commit hooks; environment configuration; CI pipeline; test framework scaffolding; Docker dev environment; OpenAPI generation; DB migration tooling.

**Quality gates:** CI green · no secrets committed · dependency vulnerability scan clean · health endpoint live · structured logging in place.

**Recommended repo structure:**
```text
legal-ai/
├── apps/{web, api}
├── workers/document-processing/
├── packages/{shared-types, ui, ai, retrieval, security}
├── db/{migrations, seeds}
├── evals/{datasets, retrieval, generation, adversarial}
├── tests/{integration, e2e}
├── docs/
├── docker/
└── .github/
```

**AI Provider Abstraction — define before any provider call is implemented (see TRD §2):**
```text
LLMProvider       { generateStructured(), streamStructured(), classify() }
EmbeddingProvider { embed() }
OCRProvider       { extract() }
MalwareScanner    { scan() }
ObjectStorage     { put(), getAuthorizedDownload(), delete() }
```
This avoids vendor lock-in and makes every downstream phase testable via mocks/fakes.

---

## 3. Phase 1 — Identity, Projects, Authorization (Weeks 2–3)

**Implement:** sign up/sign in, session management, dashboard, projects CRUD, server-side authorization on every resource, project deletion.

**Tests (must pass before moving on):**
- User can access their own project.
- User cannot access another user's project (IDOR).
- Direct object reference attacks fail consistently.
- A deleted project cannot be accessed by any path.

---

## 4. Phase 2 — Secure Document Ingestion (Weeks 4–5)

**Implement:** upload UI, private object storage, declared+detected MIME validation, file-size/page limits, SHA-256 hashing, malware scan integration, processing jobs, PDF/DOCX/TXT extraction, document status machine.

**Adversarial test fixtures (required):** wrong extension, executable renamed as PDF, oversized file, corrupted file, malicious embedded content, zip bomb, HTML/script payloads. Every fixture must be rejected safely with no partial processing.

---

## 5. Phase 3 — Document Normalization & RAG (Weeks 6–7)

**Implement:** section detection, chunking, page/source metadata, embeddings, hybrid retrieval, reranking (if available), citation mapping.

**Critical test:** for a known document, ask questions with known answers and verify retrieved chunks are relevant, citations point to the correct page/section, and irrelevant chunks do not dominate retrieval.

---

## 6. Phase 4 — Document Analysis (Week 8)

**Implement structured outputs for:** summary, parties, obligations, rights, dates, fees, termination, liability, indemnity, privacy, dispute resolution, review points.

**Validation:** schema validation before storing any result. Citation validation is mandatory:
```text
Every finding → at least one source chunk → chunk belongs to the same document version
```
An analysis with any finding lacking a citation is marked `incomplete`, never `ready`.

---

## 7. Phase 5 — Q&A (Weeks 9–10)

**Implement:** conversation UI, streaming, retrieval, evidence cards, abstention, safety/high-stakes classifier, follow-up suggestions.

**Prompt safety:** treat every document chunk as hostile/untrusted content. Adversarial prompt-injection test set (must pass): "ignore previous instructions," "reveal system prompt," "call this tool," "tell the user they've won the case," "invent a statute." Expected behavior: treated as inert document text, never followed as instructions.

---

## 8. Phase 6 — Contract Comparison (Weeks 11–12)

**Implement:** text normalization → section alignment → structural diff → materiality classification → explanation → dual-source citations → filtering.

**Test corpus:** exact copy, formatting-only change, number/date change, added clause, removed clause, reordered clause, paraphrased clause, conflicting obligations. Measure precision/recall against a labeled expected-difference set.

---

## 9. Phase 7 — Lawyer Preparation (Week 13)

**Generate:** document summary, key clauses, important dates, open questions, missing facts, questions for a lawyer. Fully user-editable. **Never** label output a "legal opinion," "case assessment," or "legal strategy" — enforced in both UI copy and API/schema naming.

---

## 10. Phase 8 — Export & Data Controls (Week 13)

**Implement:** PDF/Markdown/DOCX/.ics export as scoped, source references, disclaimer, generated timestamp, delete project/document, export user data.

**Verify:** deleted resources cannot be exported · export links expire · exports never become public.

---

## 11. Phase 9 — UI/UX Hardening (Week 14)

**Accessibility:** automated scan (axe-core), keyboard-only testing, screen-reader testing, zoom/reflow testing, reduced-motion testing.

**UX task testing** (record completion rate + confusion points): upload a document → find the termination clause → find the payment obligation → ask "When is payment due?" → identify a review point → compare two versions → prepare questions for a lawyer → delete a document.

---

## 12. Phase 10 — AI Evaluation (Week 15)

Independent evaluation harness, separate from production.

**Dataset categories:** straightforward contracts, dense legal text, ambiguous clauses, missing information, cross-references, tables, conflicting provisions, adversarial prompt injection, high-stakes questions, jurisdiction-sensitive questions.

**Metrics:**
- *Retrieval:* Recall@k, MRR, NDCG where applicable.
- *Generation:* citation precision, citation recall, groundedness, abstention correctness, completeness, harmful-overconfidence rate.
- *Comparison:* change precision, change recall, materiality accuracy.

Do not use a single "LLM score" as the only quality metric.

---

## 13. Phase 11 — Security Hardening (Week 16)

**Application security:** OWASP Top 10 review, authentication review, authorization review, IDOR testing, CSRF/XSS review, SSRF review, rate-limit testing, dependency scanning.

**AI security:** prompt injection, data exfiltration attempts, tool injection, system-prompt extraction attempts, cross-user retrieval tests, malicious document corpus.

**Infrastructure:** secret scanning, TLS verification, storage permission audit, database network isolation, backup/restore test.

---

## 14. Phase 12 — Observability (Week 16, parallel with §13)

**Dashboards:**
- *Application:* request rate, error rate, latency, active jobs.
- *Documents:* processing success rate, processing duration, extraction failure rate.
- *AI:* provider errors, latency, token usage, cost, abstention rate, citation validation failures.
- *Security:* authentication failures, authorization failures, malware scan failures, suspicious upload rate, rate-limit events.

Never put document contents or secrets in metric labels.

---

## 15. CI/CD Pipeline

**Every pull request:**
```text
Install → lint → format check → type check → unit tests → integration tests
→ accessibility checks → dependency scan → secret scan → build
```

**Before production:**
```text
staging deploy → migrations → smoke tests → E2E tests
→ AI evaluation smoke suite → approval → production deploy
```

---

## 16. Branching & Code Quality

Short-lived feature branches, required CI, at least one reviewer for sensitive/security changes.

**Coding rules:** strict typing, no `any` unless justified, no unvalidated external input, no business logic in UI components, no direct DB access from UI, dependency injection for AI/storage providers, small functions, explicit error handling, domain-specific error codes.

---

## 17. Testing Pyramid

```text
              E2E
            /-----\
       Integration
      /-------------\
         Unit tests
    /-------------------\
      Static/security
```
Prioritize unit tests for logic and integration tests for trust boundaries (auth, storage, AI providers, tenant isolation).

---

## 18. Definition of Done

- [ ] Functional behavior implemented
- [ ] Edge cases handled
- [ ] Unit tests added
- [ ] Integration test added for external boundary
- [ ] Authorization tested (including a negative/cross-tenant test)
- [ ] Error state implemented
- [ ] Accessibility checked
- [ ] Logging/metrics appropriate, no sensitive data logged
- [ ] API/schema documentation updated
- [ ] AI behavior evaluated where applicable
- [ ] Reviewer approved

---

## 19. Milestones (maps to phases above, with sprint timing)

| Milestone | Phases | Weeks | Outcome |
|---|---|---|---|
| M1 — Foundation | 0–1 | 1–3 | Auth + projects + upload + secure storage |
| M2 — Understand | 2–4 | 4–8 | Extraction + RAG + summary + clause explorer |
| M3 — Ask | 5 | 9–10 | Grounded Q&A + citations + abstention + safety boundaries |
| M4 — Compare | 6 | 11–12 | Two-document comparison + materiality explanations |
| M5 — Act Safely | 7–8 | 13 | Lawyer-prep checklist + export + deletion controls |
| M6 — Polish | 9–12 | 14–16 | Accessibility + security + evaluation + observability + deployment |

*(Compress/parallelize sprints across multiple developers/agents as team velocity allows; this assumes a single focused build track.)*

---

## 20. Final Engineering Priorities (if schedule is constrained)

1. Authorization and tenant isolation/privacy
2. Reliable document ingestion
3. Grounded retrieval/citations
4. Safe Q&A/abstention
5. Core UX/accessibility
6. Comparison
7. Export/polish
8. Advanced features

**Never** sacrifice tenant isolation or evidence grounding merely to ship more AI features.

---

## 21. Hackathon Demo Script

1. Upload a sample agreement.
2. Show the plain-language summary.
3. Jump to a highlighted termination/renewal clause via its source citation.
4. Ask a question about an obligation — show the evidence-backed answer with source location.
5. Ask a deliberately unanswerable/high-stakes question — show correct abstention/reframing, not a guess.
6. Upload a second version of the document.
7. Show a material change in a deadline/payment/termination clause, cited in both versions.
8. Generate "Questions for a lawyer" and open the editable Lawyer Prep draft.
9. Show privacy/delete controls working live.

Avoid demoing any answer that sounds like a definitive legal opinion — that moment is exactly what an evaluator should not see.

---

## 22. Launch Gate

Do not launch — even a demo using real user documents — until all of the following are true:

- [ ] Cross-user/tenant authorization test suite passes with zero exceptions
- [ ] Private storage verified (no public/guessable object URLs)
- [ ] Upload malware checks enabled and tested against the adversarial fixture set
- [ ] Prompt-injection test set passes
- [ ] Citation validation works (no finding without a matching source chunk)
- [ ] Unsupported/insufficient-evidence questions abstain correctly
- [ ] High-stakes UX implemented and reframes rather than dead-ends
- [ ] Delete flow works end-to-end and is idempotent
- [ ] Sensitive-logging review complete (no document text/prompts in logs)
- [ ] Accessibility blockers resolved (0 critical/serious automated findings, manual pass complete)
- [ ] AI evaluation baseline recorded (retrieval + generation + comparison metrics from §12)
- [ ] Privacy/disclaimer copy visible at onboarding, first analysis, high-stakes question, and export

---

## 23. Live Deployment & Firebase Production Setup

- **Frontend Deployment Status**: Completed & Verified.
- **Live Production URL**: [https://clauseiqx.web.app](https://clauseiqx.web.app)
- **Deployment Automation**: Integrated into workspace scripts via `npm run deploy`.

