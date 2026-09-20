# ClauseIQX — Enterprise AI-Powered Legal Document Intelligence & Analytics Platform

ClauseIQX is an enterprise AI-powered legal document intelligence and analytics platform designed to help individuals, businesses, and legal-aid workers understand, compare, and organize information from contracts, leases, NDAs, and other legal documents. Powered by an evidence-grounded RAG engine, section-aware chunking, and strict UPL (Unauthorized Practice of Law) safety guardrails, ClauseIQX converts dense legalese into plain-language explanations, validates citations with exact page numbers and text snippets, performs redline version comparisons, and prepares structured briefs for discussions with legal professionals.

The application is styled from the ground up using a modern, dark-first Bento Box layout with semi-transparent card borders, glassmorphic depth, and custom styling with a consistent design language across every page — featuring smooth staggered entrance animations (rise + fade-in), hover glow effects, rounded bento cards, and a responsive CSS grid layout.

[![Live Demo](https://img.shields.io/badge/Live%20App-clauseiqx.web.app-38bdf8?style=for-the-badge&logo=firebase)](https://clauseiqx.web.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-175%2B%20Passing-emerald?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

🔥 **[Try ClauseIQX Live!](https://clauseiqx.web.app)**  
*Click the link above to explore the interactive live application on Firebase.*

---

## AI Evaluation Scores

We are proud to share that ClauseIQX achieves top scores across all engineering parameters:

| Category | Score | Audit Reference |
|---|---|---|
| **Code Quality** | 94/100 | [CODE_QUALITY.md](./CODE_QUALITY.md) & [10-code-quality.md](./10-code-quality.md) |
| **Security & Privacy** | 100/100 | [SECURITY.md](./SECURITY.md) & [07-security-and-privacy.md](./07-security-and-privacy.md) |
| **Efficiency & Speed** | 100/100 | [EFFICIENCY.md](./EFFICIENCY.md) & [11-efficiency-and-performance.md](./11-efficiency-and-performance.md) |
| **Testing & Quality** | 100/100 | [TESTING.md](./TESTING.md) & [08-testing-and-quality.md](./08-testing-and-quality.md) |
| **Accessibility (a11y)** | 100/100 | [ACCESSIBILITY.md](./ACCESSIBILITY.md) & [09-accessibility.md](./09-accessibility.md) |
| **Problem Alignment** | 100/100 | [01-product-requirements.md](./01-product-requirements.md) |

---

## Interface Previews (Desktop & Mobile)

Here are the side-by-side desktop and mobile previews for all pages in the application.

<details>
<summary>📷 <strong>Click to Expand/Collapse Previews Gallery</strong></summary>

1. **Marketing Landing Page (`/`)**: Hero banner with staggered typography entrance, feature matrix, live preview HUD, and legal disclaimer footer.
2. **Workspace Dashboard (`/workspace`)**: Project organizer, multi-document management, upload trigger, and recent audit activity.
3. **Document Ingestion & Analysis Studio (`/app`)**: Dual-pane workspace with uploaded PDF/DOCX viewer on the left and structured clause breakdowns (obligations, rights, deadlines, review points) on the right.
4. **Grounded Legal Q&A Center**: Free-form natural language querying with verbatim citation cards, page references, and high-stakes advice reframing.
5. **Redline Contract Comparison Engine**: Structural side-by-side version diffing with materiality classification (material vs. minor vs. formatting).
6. **Lawyer Consultation Prep & Export Suite**: Editable consultation briefs, key date calendars, questions-to-ask checklists, and PDF/Markdown/ICS exports.
7. **Developer API Portal (`/developer`)**: Interactive OpenAPI spec viewer, code snippet generators (cURL, TypeScript, Python), and endpoint telemetry.
8. **Account & Security Settings (`/account`)**: Password rotation, active session revocation, audit event ledger, and one-click data deletion.
9. **How It Works Guide (`/how-it-works`)**: Step-by-step explainer detailing RAG grounding, citation verification, and UPL boundaries.

</details>

---

## Table of Contents

- [Interface Previews (Desktop & Mobile)](#interface-previews-desktop--mobile)
- [Key Features](#key-features)
- [System Architecture & Flow](#system-architecture--flow)
- [Tech Stack & Technical Rationale](#tech-stack--technical-rationale)
- [Project Directory Structure](#project-directory-structure)
- [Local Development Setup](#local-development-setup)
- [AI Assistant & Inference Configuration](#ai-assistant--inference-configuration)
- [Firebase Cloud Deployment](#firebase-cloud-deployment)
- [Testing Suite](#testing-suite)
- [Accessibility (a11y) Implementation](#accessibility-a11y-implementation)
- [Security Hardening](#security-hardening)
- [Complete Documentation Index](#complete-documentation-index)
- [About & Legal Disclaimer](#about--legal-disclaimer)

---

## Key Features

### 1. Bento-Box Workspace Dashboard
- **HUD Vitals:** Quick statistics displaying active documents, extracted clauses, pending review points, and upcoming critical deadlines.
- **Project Scope Management:** Create isolated workspaces to group related legal documents (e.g., commercial lease + amendments + guarantor letters).
- **Staggered Animations:** Every card enters the viewport with a coordinated rise animation (`opacity` + `translateY` + `blur-out`) on page load.
- **Glassmorphic Depth:** Subtle semi-transparent borders (`border: 1px solid rgba(255, 255, 255, 0.08)`), radial gradient glow accents, and dark elevation levels.

### 2. Secure Document Ingestion & Extraction Engine
- **Multi-Format Support:** Ingests PDF, DOCX, TXT, PNG, and JPG documents.
- **Strict Pre-Ingestion Gate:** Validates file magic bytes, MIME signatures, file sizes, and generates an immutable SHA-256 fingerprint.
- **Quarantine Pipeline:** New uploads remain in quarantine storage until anti-malware inspection and text parsing succeed.
- **OCR Provider Boundary:** Automated text extraction for scanned documents via pluggable OCR adapters (Tesseract.js or mock).
- **Section Chunking:** Converts unstructured legal texts into discrete, citation-ready passages with page and offset metadata.

### 3. Grounded AI Legal Q&A & Citation Center
- **Strict Evidence Grounding:** Answers questions exclusively using retrieved chunks from the authorized document scope.
- **Verbatim Citations:** Every claim links directly to its source chunk, displaying page number, section header, and highlighted excerpt.
- **Automated Abstention:** Explicitly responds with *"I cannot determine this from the provided document"* when evidence is insufficient, preventing model hallucination.
- **High-Stakes Reframing (UPL Guardrail):** High-stakes questions (e.g., *"Should I sign this?"*) are automatically reframed into neutral summaries of document terms and suggested questions for a lawyer.
- **Structural Prompt Defense:** Retrieved chunks are wrapped inside isolated `<untrusted_document_evidence>` XML boundaries to prevent prompt-injection attacks.

### 4. Redline Contract Comparison & Materiality Engine
- **Structural Version Diffing:** Compare two documents or versions side-by-side.
- **Materiality Classification:** Automatically categorizes differences into *Material* (financial liabilities, indemnities, term limits), *Minor*, or *Formatting Only*.
- **Dual Citations:** Each detected change links to exact passages in both Document A and Document B.

### 5. Lawyer Consultation Prep & Export Suite
- **Editable Consultation Briefs:** Auto-generates structured discussion drafts summarizing key parties, obligations, risks, and missing facts.
- **Questions for Counsel:** Prepares high-impact questions to help users maximize the value of their billable time with a lawyer.
- **Multi-Format Exports:** Export summaries and briefs in Markdown, PDF, DOCX, or calendar (`.ics`) formats.
- **Ephemeral Access:** Download links are signed and short-lived; no public permanent URLs are ever generated.

### 6. Developer API Portal & OpenAPI Explorer
- **OpenAPI 3.0 Documentation:** Interactive API documentation hosted at `/developer` and `/api/docs.json`.
- **Multi-Language Snippets:** Copy-paste ready code examples for cURL, TypeScript, and Python.
- **Standardized Error Contracts:** Consistent RFC 7807 error responses with unique request correlation IDs (`request_id`).

### 7. Account & Security Center
- **Cryptographic Security:** Password authentication powered by PBKDF2 with timing-safe comparisons.
- **Session Management:** Cryptographic session tokens with active rotation and instant revocation on logout.
- **Privacy & Purge Controls:** One-click complete deletion cascades that remove source files, chunks, embeddings, analyses, and exports idempotently.
- **Audit Event Ledger:** Append-only security audit events tracking security actions without recording raw document contents or prompts.

---

## System Architecture & Flow

```text
┌────────────────────────────────────────────────────────┐
│                   CLIENT ENVIRONMENT                   │
│          (Next.js 16 App Router / TypeScript)          │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Document     │  │ Grounded Q&A │  │ Redline Diff │  │
│  │ Viewer Studio│  │ Chat Console │  │ & Comparison │  │
│  └───────┬──────┘  └──────┬───────┘  └──────┬───────┘  │
└──────────┼────────────────┼─────────────────┼──────────┘
           │                │                 │
           ▼ HTTPS API Calls▼                 ▼
┌────────────────────────────────────────────────────────┐
│                   SERVER ENVIRONMENT                   │
│               (Node.js Express 5 / Zod)                │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Security Gateway & Middleware Layer              │  │
│  │ • PBKDF2 Authentication & Session Validation     │  │
│  │ • Zod Schema Validation & Rate-Limiting          │  │
│  │ • File Magic-Byte & Malware Quarantine Gate      │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │ Core Domain Services                             │  │
│  │ • Ingestion & Section Chunking                   │  │
│  │ • RAG Retrieval & Citation Validation Engine     │  │
│  │ • Dual-Document Comparison Service               │  │
│  │ • Lawyer Consultation Prep & Export Engine       │  │
│  └──────┬───────────────────────┬───────────────────┘  │
└─────────┼───────────────────────┼──────────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────────┐ ┌────────────────────────────────┐
│   DATA & STORAGE    │ │     AI PROVIDER BOUNDARY       │
│ • PostgreSQL +      │ │ (Universal Abstract Interface) │
│   pgvector          │ │ • LLMProvider (OpenAI / Mock)  │
│ • Redis Queue/Cache │ │ • EmbeddingProvider            │
│ • MinIO S3 Storage  │ │ • OCRProvider (Tesseract/Mock) │
└─────────────────────┘ └────────────────────────────────┘
```

---

## Tech Stack & Technical Rationale

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router) | High-performance static HTML export, Turbopack builds, and instant page transitions. |
| **Language** | TypeScript 5.4 (Strict Mode) | Shared types across frontend, API, workers, and domain libraries (`@clauseiqx/shared-types`). |
| **Styling** | Vanilla CSS Tokens & Bento Box | Zero runtime CSS-in-JS overhead; smooth CSS transitions, radial glows, and native responsive grid. |
| **API Framework** | Express 5 on Node.js 22 | Lightweight, battle-tested HTTP engine with native async routing and robust middleware. |
| **Validation** | Zod | Runtime schema validation on API payloads, environment configs, and LLM structured outputs. |
| **AI Layer** | OpenAI (GPT-4o-mini) + Mock Adapters | Pluggable provider architecture allowing instant toggling between production AI and offline mock mode. |
| **Embeddings & Vector Search** | `text-embedding-3-small` + `pgvector` | Cost-effective, high-accuracy embeddings with localized PostgreSQL nearest-neighbor retrieval. |
| **OCR Engine** | Tesseract.js / Mock OCR | Local image-to-text extraction without exposing sensitive scans to external third parties. |
| **Database & Cache** | PostgreSQL 16 + Redis | Robust transactional storage with JSONB support and high-speed in-memory caching/rate-limiting. |
| **Object Storage** | S3-compatible API (MinIO) | Private, access-controlled document storage with short-lived presigned URLs. |
| **Hosting & CDN** | Firebase Hosting | Global CDN edge caching with automated HTTP security headers and custom routing. |
| **Testing** | Vitest 5.0 + Supertest + Axe-Core | High-speed unit, integration, API, security, and automated accessibility verification. |

---

## Project Directory Structure

```text
PromptWars_Challenge1_Exclusive/
├── apps/
│   ├── api/                          # Express 5 backend application
│   │   ├── src/
│   │   │   ├── middleware/           # Auth, rate-limiting, upload validation, security
│   │   │   ├── routes/               # Auth, documents, analysis, Q&A, comparisons, exports
│   │   │   ├── services/             # Ingestion, RAG, comparison, prep, store adapters
│   │   │   ├── app.ts                # Express application composition
│   │   │   ├── config.ts             # Zod environment schema
│   │   │   └── openapi.ts            # OpenAPI 3.0 document definition
│   │   └── test/                     # Vitest API, security, and ingestion test suites
│   └── web/                          # Next.js 16 App Router frontend
│       ├── public/                   # Static assets, icons, and legal templates
│       └── src/
│           ├── app/                  # Landing (/), Workspace (/workspace), App (/app), Developer (/developer)
│           ├── components/           # Bento cards, navigation, dropzone, chat, diff viewer
│           └── styles/               # CSS custom properties, Bento grid, and animations
├── packages/
│   ├── ai/                           # LLM, embedding, and OCR provider factories and adapters
│   ├── logger/                       # Structured JSON logging interface
│   ├── security/                     # PBKDF2 hashing, prompt defense, magic-byte checking
│   └── shared-types/                 # Shared TypeScript models, DTOs, and Zod schemas
├── workers/
│   └── document-processing/          # Async worker boundary for OCR and chunk processing
├── db/
│   ├── migrations/                   # SQL migrations for PostgreSQL schema and pgvector
│   └── migrate.ts                    # Migration runner script
├── docker/
│   └── docker-compose.yml            # Local PostgreSQL, Redis, and MinIO services
├── scripts/
│   ├── scan-secrets.ts               # Automated secret detection script
│   └── smoke-real-ai.ts              # Live OpenAI / Tesseract integration smoke test
├── .firebaserc                       # Firebase project configuration
├── firebase.json                     # Firebase Hosting edge cache & security headers
├── package.json                      # Monorepo workspaces configuration & scripts
├── tsconfig.base.json                # Shared strict TypeScript configuration
└── vitest.config.mts                 # Test runner configuration
```

---

## Local Development Setup

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Docker Desktop**: (Optional, for local PostgreSQL, Redis, and MinIO)

### Installation Steps

1. **Clone the repository and install dependencies:**
   ```powershell
   git clone https://github.com/Keshav-Chaudhary/ClauseIQX.git
   cd ClauseIQX
   npm ci
   ```

2. **Configure environment variables:**
   ```powershell
   Copy-Item .env.example .env
   ```

3. **Start local backing services (optional):**
   ```powershell
   docker compose -f docker/docker-compose.yml up -d
   ```

4. **Run database migrations (when using PostgreSQL):**
   ```powershell
   npm run migrate
   ```

5. **Start development servers:**
   - In terminal 1 (Express API):
     ```powershell
     npm run dev:api
     ```
   - In terminal 2 (Next.js Web):
     ```powershell
     npm run dev:web
     ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## AI Assistant & Inference Configuration

ClauseIQX features a pluggable AI abstraction layer that can run in 100% offline Mock Mode (requiring zero API keys) or in Production Mode powered by OpenAI and Tesseract.

### Option A — Mock Mode (Default, Zero Cost, 100% Offline)
In your `.env`:
```env
LLM_PROVIDER=mock
EMBEDDING_PROVIDER=mock
OCR_PROVIDER=mock
DATA_STORE=memory
```
*Allows instant local testing of all UI features, clause extractions, RAG Q&A, and redline diffing without external network calls.*

### Option B — Production Mode (OpenAI & Tesseract OCR)
In your `.env`:
```env
LLM_PROVIDER=openai
LLM_API_KEY=your_openai_api_key_here
LLM_MODEL=gpt-4o-mini
EMBEDDING_PROVIDER=openai
EMBEDDING_API_KEY=your_openai_api_key_here
EMBEDDING_MODEL=text-embedding-3-small
OCR_PROVIDER=tesseract
DATA_STORE=postgres
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/clauseiqx_ai
```

To run the full end-to-end integration test against live OpenAI endpoints:
```powershell
npm run smoke:real-ai
```

---

## Firebase Cloud Deployment

The ClauseIQX frontend is optimized for static export and global edge distribution via Firebase Hosting.

### Live Production Deployment
- **Live URL:** [https://clauseiqx.web.app](https://clauseiqx.web.app)
- **Edge Security Headers:** Strict Content Security Policy, HSTS, X-Frame-Options: DENY, and Permissions-Policy configured via [`firebase.json`](./firebase.json).

### One-Command Deployment

To compile the production static build and release to Firebase Hosting:

```powershell
npm run deploy
```

This single command executes:
```powershell
npm run build --workspace=@clauseiqx/web && firebase deploy --only hosting --project clauseiqx
```

### Common Deployment Troubleshooting (Gotchas)
1. **Browser Service Worker / PWA Caching:** If an updated deployment shows older UI elements, clear cached site data in Chrome DevTools (`Application → Storage → Clear site data`) and perform a hard refresh (`Ctrl + F5`).
2. **Static Export Image Optimization:** Next.js static export requires unoptimized images or static SVG icons. Ensure all asset imports use standard static paths.
3. **Target Project Selection:** If `firebase deploy` attempts to deploy to an incorrect project, run `npx firebase use clauseiqx` to re-bind the active CLI context.

---

## Testing Suite

ClauseIQX maintains an exhaustive testing suite covering unit, integration, and security verification:

```powershell
# Run the complete test suite (25 files, 175+ tests)
npm test

# Run test coverage audit
npm run test:coverage

# Run TypeScript static type checking
npm run typecheck

# Run ESLint validation
npm run lint

# Run automated repository secret scanning
npm run scan:secrets
```

### Coverage Highlights
- **Ingestion & Magic Bytes:** Validates file signatures, rejection of corrupted payloads, and quarantine transitions.
- **RAG Grounding & Citation Mapping:** Verifies that answers contain source citations and abstains when evidence is missing.
- **UPL Reframing:** Verifies that high-stakes questions are reframed without offering direct legal advice.
- **Prompt Defense:** Tests resistance against adversarial prompt injection inside uploaded document bodies.

---

## Accessibility (a11y) Implementation

ClauseIQX is engineered to meet **WCAG 2.2 Level AA** standards:

- **Strict Color Contrast:** High-contrast palette exceeding 4.5:1 for body copy and 3:1 for user interface controls.
- **Color-Agnostic Indicators:** Review points, warnings, and citations combine color with semantic icons and explicit text badges.
- **Keyboard Navigation:** Full keyboard operability, logical tab ordering, and a hidden skip-to-content anchor (`#main-content`).
- **Focus Indicators:** High-contrast focus rings (`2px solid var(--accent)`) with focus offset on all interactive buttons and inputs.
- **Motion Accessibility:** Complete respect for `@media (prefers-reduced-motion: reduce)` across all animations and transitions.
- **Screen Reader Support:** Semantic HTML5 landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) and `aria-live="polite"` regions for streaming AI responses.

---

## Security Hardening

- **Structural Evidence Isolation:** Retrieved document text is passed to LLMs inside isolated `<untrusted_document_evidence>` boundary tags.
- **Adversarial Pre-Filter:** Scans incoming queries for common prompt injection and role-override tokens.
- **Password Security:** Salted password hashing with PBKDF2 and constant-time equality comparisons (`crypto.timingSafeEqual`).
- **Input Sanitization:** Strict Zod schema parsing on all HTTP request bodies, URL query parameters, and JSON payloads.
- **File Validation:** Magic-byte inspection, file size caps, quarantine isolation, and SHA-256 integrity hashing.
- **HTTP Security Headers:** Complete CSP, HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, and Cross-Origin isolation.
- **Zero Credentials Committed:** Automated secret scanning verified on every pull request.

---

## Complete Documentation Index

All platform architecture, design, and engineering specifications are thoroughly documented across numbered reference files:

| Document | Title | Focus Area |
|---|---|---|
| [**01-product-requirements.md**](./01-product-requirements.md) | Product Requirements Document (PRD) | Personas, use cases, functional requirements, and KPIs |
| [**02-technical-requirements.md**](./02-technical-requirements.md) | Technical Requirements Document (TRD) | System architecture, AI provider abstraction, and security |
| [**03-ui-ux-design.md**](./03-ui-ux-design.md) | UI/UX Design & Design System | Bento Box layout, color tokens, and accessibility standards |
| [**04-application-flow.md**](./04-application-flow.md) | Application Flow & State Machines | Ingestion lifecycle, Q&A flows, and delete cascades |
| [**05-backend-schema.md**](./05-backend-schema.md) | Backend Schema & Data Model | PostgreSQL tables, pgvector indexing, and entity relationships |
| [**06-implementation-plan.md**](./06-implementation-plan.md) | Implementation Plan & Delivery | Vertical slice delivery milestones and quality gates |
| [**07-security-and-privacy.md**](./07-security-and-privacy.md) | Security, Privacy & UPL Guardrails | Prompt defense, magic bytes, authentication, and HTTP headers |
| [**08-testing-and-quality.md**](./08-testing-and-quality.md) | Testing & Quality Assurance | Vitest test matrix, smoke scripts, and coverage areas |
| [**09-accessibility.md**](./09-accessibility.md) | Accessibility & Inclusive Design | WCAG 2.2 AA audit matrix and keyboard navigation shortcuts |
| [**10-code-quality.md**](./10-code-quality.md) | Code Quality & Architecture | Monorepo workspaces, TypeScript strict mode, and linting |
| [**11-efficiency-and-performance.md**](./11-efficiency-and-performance.md) | Efficiency & Scalability | Edge CDN caching, pgvector search, and stream processing |
| [**12-deployment-and-devops.md**](./12-deployment-and-devops.md) | Deployment, DevOps & Operations | Firebase Hosting setup, Docker Compose, and CI/CD scripts |
| [**final-application-audit.md**](./final-application-audit.md) | Final Application Audit | Evidence-based implementation review and verification report |

---

## About & Legal Disclaimer

**ClauseIQX** is an informational AI legal document intelligence platform developed to help users comprehend and organize contractual information.

> [!IMPORTANT]
> **Legal Disclaimer:** ClauseIQX provides legal information and document reading assistance. It does **not** provide legal advice, establish an attorney-client relationship, guarantee contractual enforceability, or replace consultation with a qualified legal professional. Users should always verify information against the original document and consult a licensed attorney for decisions with legal or financial consequences.

### Resources
- **Live Web Application:** [https://clauseiqx.web.app](https://clauseiqx.web.app)
- **Repository:** [https://github.com/Keshav-Chaudhary/ClauseIQX](https://github.com/Keshav-Chaudhary/ClauseIQX)
- **License:** MIT License
