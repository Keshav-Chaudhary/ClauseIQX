# Product Requirements Document (PRD)
## Product: ClauseIQX — AI-Powered Legal Document Intelligence

**Version:** 2.0 (Final Merged)
**Status:** Ready for build
**Related documents:** TRD, UI/UX Design, App Flow, Backend Schema, Implementation Plan

---

## 1. Executive Summary

ClauseIQX helps individuals, small businesses, and legal-aid workers **understand, compare, and act on legal documents** — leases, employment agreements, NDAs, terms of service, insurance policies, vendor contracts — without requiring existing legal expertise.

The product provides **information, explanation, and organization**, never a legal opinion or recommendation to act. Every AI output is grounded in the user's own document, cited to its source, and explicit about what it doesn't know.

**Design contract with the user:** *Explain, don't decide.* The product never tells someone what to do, predicts an outcome, or declares something legal/illegal — it shows what the document says, flags what's worth a second look, and helps the user get a more useful conversation with a real professional when one is needed.

---

## 2. Problem Statement

Legal documents are written in dense, specialized language that's hard for non-lawyers to parse. As a result:

- People sign leases, contracts, and agreements without understanding key obligations, risks, or exit terms.
- Comparing two versions of a contract (a redline, or two competing vendor agreements) is tedious and error-prone by hand.
- Many people can't afford a lawyer for routine review, and legal-aid organizations are overloaded relative to demand.
- Even people who *do* reach a lawyer often arrive underprepared — no clear list of questions or facts — wasting billable time.

**Opportunity:** Use GenAI to lower the barrier to understanding legal documents, while treating hallucination risk, unauthorized-practice-of-law (UPL) boundaries, and data sensitivity as core product requirements rather than afterthoughts.

---

## 3. Goals & Objectives

### 3.1 Product Goals
1. Upload any common legal document → clear, plain-language, cited explanation within seconds.
2. Compare two documents (or two versions of one) and see what changed and why it's worth noticing.
3. Surface obligations, deadlines, rights, and unusual/notable clauses automatically, each traceable to exact source text.
4. Ask free-form questions and get answers grounded only in the uploaded content — and an honest "I can't answer that from this document" when evidence is insufficient.
5. Prepare for a real consultation: a summary, a checklist, open questions, and missing facts the user can bring to a lawyer — editable before export.

### 3.2 Business Goals
- Establish a credible, trustworthy pattern for "legal information" GenAI products that could extend into adjacent verticals (compliance review, policy comparison for businesses).
- Ship a demo-ready MVP that survives a live security/safety walkthrough, not just a happy-path demo.

### 3.3 Non-Goals (explicitly out of scope v1)
- Never tells a user what to do ("you should sign this," "you will win," "this is illegal/unenforceable").
- Does not represent users, file documents, or connect to court e-filing systems.
- Does not claim jurisdiction-specific legal certainty; flags when jurisdiction materially affects interpretation.
- No criminal-law matters in v1 (civil/contract/consumer/employment focus only).
- Output is never labeled a "legal opinion," "case assessment," or "legal strategy" — including the lawyer-prep report.

---

## 4. Target Users & Personas

| Persona | Description | Primary Need |
|---|---|---|
| **Priya, 29 — Renter/Consumer** | Signing a lease or employment contract, no legal background | Plain-language explanation, things worth double-checking |
| **Marcus, 41 — Small Business Owner** | Reviews vendor/client contracts regularly, no in-house counsel | Comparison across contracts, obligation/deadline tracking |
| **Dana — Legal-Aid Caseworker** | Non-lawyer intake staff at a nonprofit, high case volume | Fast triage, checklists, summaries to hand to volunteer attorneys |

---

## 5. Use Cases → Features

| Use Case | Feature |
|---|---|
| Simplify a complex document | Plain-language summary (progressive disclosure to source) |
| Compare two contracts/versions | Document Comparison (structural diff + materiality explanation) |
| Understand what to pay attention to | Clause categorization + Review Points (never "risk verdicts") |
| Ask specific questions | Grounded Q&A with citations + abstention |
| Decide next steps | Non-advisory options framing, "questions to ask a professional" |
| Prepare for a lawyer | Lawyer Prep draft (editable) + export |
| Track obligations | Deadline/obligation extraction → checklist + calendar export |

---

## 6. Functional Requirements

Priority: **M**=Must (v1), **S**=Should (v1.x), **C**=Could (future)

### 6.1 Ingestion
- FR-1 (M): Upload PDF, DOCX, TXT, or scanned image (JPG/PNG), up to a configured size/page limit.
- FR-2 (M): Automatic OCR for image-based/scanned content; OCR confidence surfaced to the user.
- FR-3 (M): Best-effort document-type detection (lease, NDA, ToS, employment agreement, etc.) to tailor analysis.
- FR-4 (S): Paste raw text instead of uploading a file.
- FR-5 (M): Reject unsupported/corrupted/oversized files with a clear, non-technical error; never a silent failure.
- FR-6 (M): Every uploaded file is scanned for malware before any parsing occurs.

### 6.2 Simplification & Summarization
- FR-7 (M): Plain-language summary of the whole document (parties, purpose, key terms, duration).
- FR-8 (M): Section-by-section explanation, each linked back to the exact source passage (page + offset).
- FR-9 (M): Reading-level toggle: Simple / Detailed.
- FR-10 (M): Analysis is not shown as "complete" until citation validation passes for all findings (no un-sourced claims reach the UI).

### 6.3 Clause & Review-Point Extraction
- FR-11 (M): Classify clauses into: Obligations, Rights, Deadlines/Dates, Financial Terms, Termination/Exit, Liability, Indemnity, Privacy, Dispute Resolution.
- FR-12 (M): Each item includes: source excerpt, plain-language explanation, category, confidence (High/Medium/Low, shown as text+icon, never color alone).
- FR-13 (S): Flag clauses that are unusual relative to common standard-form language — framed as "worth a second look," with the specific reason shown, never a severity verdict.
- FR-14 (M): Every review point includes visible disclaimer copy: "This is a review prompt generated from the document, not a legal conclusion."

### 6.4 Comparison
- FR-15 (M): Upload/select two documents; system does not assume chronology from upload order — labeled "Document A / Document B" unless the user explicitly designates old/new.
- FR-16 (M): Structural diff (added/removed/modified/reordered/paraphrased) with plain-language "why this may matter" explanation for each change.
- FR-17 (M): Each change cites the specific source location in **both** documents.
- FR-18 (S): Materiality classification (e.g., date/payment/termination changes surfaced first).

### 6.5 Grounded Q&A
- FR-19 (M): Natural-language questions about one document or, within a project, across all its documents.
- FR-20 (M): Answers grounded strictly in retrieved content; system must **abstain** ("I can't reliably answer that from the document alone") when evidence is insufficient, rather than guessing.
- FR-21 (M): Every answer shows its source citation(s); no answer is presented without at least one verified citation for document-specific claims.
- FR-22 (M): A safety/high-stakes classifier detects requests for a definitive legal conclusion or outcome prediction ("will I win," "should I sign," "is this legal") and responds with: what the document says, what remains unknown, and questions to bring to a professional — never a dead-end refusal.
- FR-23 (S): Follow-up question suggestions.

### 6.6 Actionable Outputs
- FR-24 (M): Auto-generated checklist of obligations/deadlines, each with a due date and source link; user can check items off.
- FR-25 (M): "Questions for a lawyer" list generated from review points and ambiguities.
- FR-26 (M): Lawyer Prep draft: situation summary, documents reviewed, key clauses, key dates, facts still needed, questions, user notes — fully editable before export.
- FR-27 (M): Export as PDF/DOCX/Markdown, including disclaimer, generation timestamp, and source references; export links are private and expire.
- FR-28 (S): Calendar export (.ics) for extracted deadlines.

### 6.7 Project & Account Management
- FR-29 (M): Auth (email/password + OAuth), server-side authorization on every resource, session rotation on login.
- FR-30 (M): Documents organized into Projects; optional jurisdiction and document-type tags (jurisdiction stored as "unknown" if skipped, never guessed).
- FR-31 (M): Delete a document or an entire account triggers full cascade deletion (source, chunks, embeddings, analyses, exports) within a documented SLA; deletion is idempotent.
- FR-32 (S): Optional project sharing with role-based access (Owner/Member/Viewer) for team/legal-aid use cases.
- FR-33 (M): Deleted resources can never be exported, viewed, or re-analyzed.

### 6.8 Trust, Safety & Compliance
- FR-34 (M): Persistent contextual disclaimers (onboarding, first analysis, high-stakes question, export) — not a single dismissible modal.
- FR-35 (M): No feature may output a definitive legal conclusion; only "worth reviewing with a professional," with reasoning shown.
- FR-36 (M): Full audit trail of AI outputs tied to source document version, for transparency and dispute resolution — audit trail excludes raw sensitive document text/prompt content.
- FR-37 (M): Authorization failures never leak resource existence across tenants (non-enumerating 401/403/404 policy — see TRD §4, App Flow §10).

---

## 7. Non-Functional Requirements (summary — detail in TRD)

- **Security & privacy:** encryption in transit/at rest, tenant isolation (defense-in-depth: app-layer authZ + DB constraints/RLS + private storage), malware scanning, no client-trusted ownership fields.
- **Accuracy & trust:** mandatory RAG grounding, per-claim citation, abstention over fabrication, adversarial/prompt-injection resistance.
- **Performance:** analysis of a ≤20-page document completes ≤30s p95 (async); standard API p95 <500ms excluding AI jobs; chat first token ≤2–4s.
- **Accessibility:** WCAG 2.2 AA across all screens.
- **Scalability:** stateless API tier + independently scaled async workers.

---

## 8. Sample User Stories & Acceptance Criteria

**US-1:** As Priya, I want to upload my lease and get a plain-language summary so I understand what I'm signing.
- *AC1:* Given a valid file within limits, a plain-language summary appears within 30s.
- *AC2:* Summary identifies parties, term length, rent/fees, and termination conditions, each with a source link.
- *AC3:* A contextual disclaimer appears above the first analysis shown.

**US-2:** As Marcus, I want to compare this year's vendor contract to last year's so I can see what changed.
- *AC1:* Comparison output classifies each change as added/removed/modified.
- *AC2:* Each change includes a plain-language "why this may matter" note and cites both source documents.

**US-3:** As Dana, I want a "questions to ask a lawyer" list so volunteer attorneys can start faster.
- *AC1:* List is exportable, editable before export, and each question references the clause that prompted it.

**US-4:** As any user, I want the AI to refuse to give me a definitive legal opinion, without leaving me stuck.
- *AC1:* Asking "will this hold up in court" produces: what the document says, what's unknown, and questions for a professional — not silence and not a prediction.

**US-5:** As any user, I want the system to admit when it doesn't know.
- *AC1:* If retrieved evidence doesn't support an answer, the system says so explicitly rather than guessing, and suggests what info would help.

---

## 9. Success Metrics (KPIs)

| Metric | Target (v1) |
|---|---|
| Document → summary completion rate | >95% |
| Median time-to-first-insight | <30s |
| Citation precision (sampled audit) | >98% |
| Hallucination / unsupported-claim rate (sampled audit) | <1% |
| Correct abstention rate (evidence-insufficient cases) | >95% |
| User-reported trust score (post-session survey) | ≥4.2/5 |
| Accessibility automated scan | 0 critical/serious violations |
| "Prepare for lawyer" task completion rate | >85% |
| Cross-tenant access test suite | 100% pass, zero exceptions |

---

## 10. Risks & Assumptions

| Risk | Mitigation |
|---|---|
| AI hallucinates legal facts | Mandatory RAG grounding, per-claim citation validation, abstention-over-guessing, golden-set regression gate |
| Users mistake information for advice | Persistent contextual disclaimers, high-stakes reframing (not refusal), UPL-aware copy review every sprint |
| Sensitive document data breach | Encryption, tenant isolation defense-in-depth, malware scanning, audit logging, pen-test before launch |
| Jurisdictional inaccuracy | Explicit jurisdiction tagging; "unknown" stored rather than guessed; disclaimers scale with ambiguity |
| OCR errors on scanned docs | Confidence scoring; low-confidence scans require user confirmation before deep analysis |
| Prompt injection via document content | Document text always treated as untrusted data, never instructions (see TRD §5) |

**Assumptions:** users have the right to share uploaded documents; product is not intended for documents involved in active litigation without professional supervision.

---

## 11. Roadmap Beyond v1

- Multi-language document support
- Read-only pre-signature review integration with e-signature platforms
- Attorney-marketplace referral integration
- Enterprise compliance-review mode (policy-vs-policy at scale)
- Browser extension for reviewing ToS/Privacy Policies while browsing

---

## 12. Glossary

- **RAG:** Retrieval-Augmented Generation — answers generated from retrieved source text, not model memory alone.
- **UPL:** Unauthorized Practice of Law — the product is designed to avoid ever crossing into this.
- **Groundedness:** how directly an AI answer is supported by cited source material.
- **Abstention:** the system explicitly declining to answer when evidence is insufficient, rather than guessing.
- **Review Point:** a flagged clause worth a second look — explicitly not a legal risk verdict.

---

## 13. Deployment & Production Status

- **Hosting Platform**: Firebase Hosting
- **Live Production URL**: [https://clauseiqx.web.app](https://clauseiqx.web.app)
- **Deployment Script**: `npm run deploy`


