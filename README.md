# ClauseIQX

ClauseIQX is an AI-powered legal document intelligence platform that helps people
understand, compare, and organize information from contracts and other legal
documents. It converts dense document language into plain-language
explanations, identifies important clauses and dates, answers document-based
questions with citations, and prepares structured material for a discussion
with a legal professional.

ClauseIQX provides legal information and document assistance. It does not
provide legal advice, make decisions for users, predict legal outcomes, or
replace a qualified lawyer.

## Contents

- [Product capabilities](#product-capabilities)
- [How the application works](#how-the-application-works)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [Configuration](#configuration)
- [Getting started](#getting-started)
- [Running the services](#running-the-services)
- [API overview](#api-overview)
- [Security and privacy](#security-and-privacy)
- [Testing and quality checks](#testing-and-quality-checks)
- [Documentation](#documentation)

## Product capabilities

### Document understanding

- Upload PDF, DOCX, TXT, PNG, and JPG documents.
- Validate file extensions, MIME information, magic bytes, size, and content.
- Quarantine uploads before scanning and processing.
- Extract text and page information through the OCR provider abstraction.
- Detect sections and split documents into citation-ready chunks.
- Generate embeddings for semantic retrieval.

### Analysis and review

- Generate structured document analysis.
- Organize findings by clause type, obligation, right, financial term,
  termination, liability, date, and other categories.
- Present plain-language explanations alongside source passages.
- Show review points as items that may deserve clarification or discussion,
  without presenting them as legal conclusions.
- Validate citations before analysis findings are returned.

### Grounded questions and answers

- Ask questions about one document or a project.
- Retrieve relevant document chunks before generating an answer.
- Return source citations with page and snippet information.
- Abstain when the available document evidence is insufficient.
- Reframe high-stakes questions such as “Should I sign?” without making a
  legal recommendation.
- Treat retrieved document text as untrusted data to reduce prompt-injection
  risk.

### Comparison, preparation, and exports

- Compare documents or document versions.
- Identify changes and classify their materiality.
- Prepare an editable briefing for a legal consultation.
- Track extracted dates and obligations.
- Export summaries and preparation materials in Markdown, PDF, DOCX, or
  calendar format.

### Accounts and projects

- Create an account and authenticate with password-based sessions.
- Create projects for organizing related documents.
- Apply project roles such as owner, member, and viewer.
- Maintain audit events for important project, document, and account actions.

## How the application works

### Document processing flow

```text
User
  │
  ▼
Next.js web application
  │
  ▼
Express API
  │
  ├─ Authentication and project authorization
  ├─ Request validation and rate limiting
  └─ Document ingestion
       │
       ├─ File validation and SHA-256 hashing
       ├─ Quarantine storage
       ├─ Malware scanning
       ├─ Text extraction / OCR
       ├─ Section detection and chunking
       └─ Embedding generation
              │
              ▼
       Retrieval, analysis, comparison, Q&A, and export services
              │
              ▼
       Cited results returned to the web application
```

### Question-answering flow

1. The user submits a question for a project or document.
2. The API validates and sanitizes the question.
3. Retrieval searches only the authorized project/document scope.
4. Relevant chunks are passed to the configured LLM provider as evidence.
5. The response is stored with message metadata and citations.
6. The API returns the answer, abstention/high-stakes status, and citation
   snippets.

## Technology stack

| Area | Technology |
|---|---|
| Web application | Next.js 16, React 18, TypeScript |
| API | Node.js, Express 5, TypeScript |
| Validation | Zod |
| AI provider layer | Provider interfaces with OpenAI, Tesseract, and mock adapters |
| Authentication | Password hashing with PBKDF2 and session tokens |
| Data model | PostgreSQL-compatible schema with pgvector support |
| Caching and queues | Redis configuration and provider abstractions |
| Object storage | S3-compatible storage abstraction with local/mock support |
| Testing | Vitest, Supertest, Testing Library, axe-core |
| Development services | PostgreSQL/pgvector, Redis, and MinIO through Docker Compose |

The codebase uses npm workspaces:

- `apps/api`
- `apps/web`
- `packages/ai`
- `packages/logger`
- `packages/security`
- `packages/shared-types`
- `workers/document-processing`

## Repository structure

```text
Legal assistance/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ middleware/       Authentication, validation, rate limits, upload safety
│  │  │  ├─ routes/           Auth, projects, documents, analysis, Q&A, exports
│  │  │  ├─ services/         Ingestion, retrieval, analysis, comparison, exports
│  │  │  ├─ app.ts            Express application composition
│  │  │  ├─ config.ts         Environment configuration schema
│  │  │  └─ openapi.ts        OpenAPI document
│  │  └─ test/                API, security, ingestion, and service tests
│  └─ web/
│     └─ src/
│        ├─ app/               Next.js pages and application layout
│        ├─ components/        Navigation, upload, export, and citation UI
│        └─ styles/             Design tokens and global styles
├─ packages/
│  ├─ ai/                     LLM, embeddings, OCR, and provider factories
│  ├─ logger/                 Structured application logging
│  ├─ security/               Auth, hashing, MIME checks, prompt defense, limits
│  └─ shared-types/           Shared domain and API types
├─ workers/
│  └─ document-processing/    Background document-processing boundary
├─ db/
│  ├─ migrations/             SQL schema migrations
│  └─ migrate.ts              Migration runner
├─ docker/
│  └─ docker-compose.yml      PostgreSQL, Redis, and MinIO services
├─ scripts/
│  └─ scan-secrets.ts         Repository secret scanning
├─ tests/
│  └─ secrets-scan.test.ts    Secret-scanning test
├─ .env.example               Environment variable template
├─ package.json               Root workspace scripts
├─ tsconfig.base.json         Shared TypeScript settings
├─ vitest.config.mts          Test runner configuration
├─ 01-product-requirements.md  Product requirements
├─ 02-technical-requirements.md Technical requirements
├─ 03-ui-ux-design.md          Interface and accessibility requirements
├─ 04-application-flow.md      User and processing flows
├─ 05-backend-schema.md        Data model and schema design
└─ 06-implementation-plan.md   Delivery and implementation plan
```

## Configuration

Copy the environment template before starting the application:

```powershell
Copy-Item .env.example .env
```

Important configuration groups include:

| Group | Variables |
|---|---|
| Application | `NODE_ENV`, `PORT`, `WEB_PORT`, `API_BASE_URL`, `FRONTEND_URL` |
| Sessions and access | `SESSION_SECRET`, `JWT_SECRET`, `COOKIE_DOMAIN`, `CORS_ORIGINS` |
| Database | `DATA_STORE`, `DATABASE_URL`, `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX` |
| Redis | `REDIS_URL` |
| Object storage | `STORAGE_PROVIDER`, `S3_ENDPOINT`, bucket names, access keys |
| Language model | `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, token and temperature limits |
| Embeddings | `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_API_KEY` |
| OCR | `OCR_PROVIDER`, `OCR_API_KEY` |
| Malware scanning | `MALWARE_SCANNER`, `CLAMAV_HOST`, `CLAMAV_PORT` |
| Operations | rate-limit and logging settings |

Keep `.env` private. Do not commit API keys, passwords, session secrets, or
storage credentials.

Before starting the API, validate the active runtime configuration:

```powershell
npm run check:runtime-env
```

This catches the common configuration mistakes that would otherwise fail only
later in the request flow, such as `DATA_STORE=postgres` without
`DATABASE_URL`, or `LLM_PROVIDER=openai` without `LLM_API_KEY`.

### AI provider modes

Mock/demo mode requires no provider credentials:

```powershell
LLM_PROVIDER=mock
EMBEDDING_PROVIDER=mock
OCR_PROVIDER=mock
```

Real-provider mode requires an OpenAI key for both generation and embeddings,
plus local Tesseract.js language data:

```powershell
LLM_PROVIDER=openai
LLM_API_KEY=your-openai-key
LLM_MODEL=gpt-4o-mini
EMBEDDING_PROVIDER=openai
EMBEDDING_API_KEY=your-openai-key
EMBEDDING_MODEL=text-embedding-3-small
OCR_PROVIDER=tesseract
```

Start the API with those variables and run the end-to-end upload, analysis,
and cited Q&A smoke test (it is intentionally excluded from `npm test`):

```powershell
npm run dev:api
npm run smoke:real-ai
```

The smoke test needs a running API, a configured database store, and a valid
OpenAI key. It creates a disposable smoke-test account and reports upload,
analysis citation validation, answer status, and citation count.

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop, if using the local PostgreSQL, Redis, and MinIO services

### Install dependencies

```powershell
npm ci
Copy-Item .env.example .env
```

### Start infrastructure services

```powershell
docker compose -f docker/docker-compose.yml up -d
```

The Compose file provides:

- PostgreSQL with pgvector on port `5432`
- Redis on port `6379`
- MinIO API on port `9000`
- MinIO console on port `9001`

### Apply database migrations

```powershell
npm run migrate
```

`npm run migrate` requires `DATABASE_URL` and applies every SQL file in
`db/migrations/` once, recording applied filenames in `schema_migrations`.
The local Docker database uses:

```powershell
$env:DATABASE_URL = "postgresql://postgres:postgrespassword@localhost:5432/clauseiqx_ai"
npm run migrate
```

The API uses PostgreSQL when `DATA_STORE=postgres` (the production-ready
default shown in `.env.example`). Set `DATA_STORE=memory` only for an
intentional demo or test run without a database.

## Running the services

Run the API and web application in separate terminals:

```powershell
npm run dev:api
```

```powershell
npm run dev:web
```

Default URLs:

- Web application: `http://localhost:3000`
- API: `http://localhost:4000`
- API health: `http://localhost:4000/health`
- OpenAPI JSON: `http://localhost:4000/api/docs.json`

For a production-style local run:

```powershell
npm run build
npm run start:api
npm run start:web
```

## API overview

The API is versioned under `/api/v1`.

| Resource | Main endpoints |
|---|---|
| Authentication | `/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/me` |
| Projects | `/projects`, `/projects/:projectId` |
| Documents | `/projects/:projectId/documents` |
| Analyses | `/projects/:projectId/documents/:documentId/analyses` |
| Conversations | `/projects/:projectId/conversations` |
| Direct Q&A | `/projects/:projectId/conversations/direct` |
| Comparisons | `/projects/:projectId/comparisons` |
| Lawyer preparation | `/projects/:projectId/lawyer-prep` |
| Exports | `/projects/:projectId/exports` |
| Health and metrics | `/health`, `/api/v1/metrics` |

All protected resources require authentication and project authorization.
Resource-not-found responses use a non-enumerating error contract where
appropriate. Request IDs are returned in API error payloads for support and
diagnostics.

## Security and privacy

Legal documents can contain confidential personal and business information.
The application includes the following controls:

- Password hashing and timing-safe password verification.
- Session rotation and session revocation.
- Project-scoped authorization and cross-project access checks.
- Request IDs and structured server-side logging.
- Input validation with strict Zod schemas.
- File extension, MIME, magic-byte, size, and content checks.
- Quarantine-before-processing document flow.
- Malware-scanner provider boundary.
- SHA-256 document hashing.
- Prompt-injection defenses for retrieved document evidence.
- Citation metadata for generated answers and findings.
- Sanitized error responses that avoid exposing internal paths and SQL details.
- Audit events for security-relevant actions.
- Legal-information notices throughout the user interface.

Users should still verify important information against the original document
and obtain professional legal advice for decisions with legal or financial
consequences.

## Testing and quality checks

Run the complete test suite:

```powershell
npm test
```

Run static type checking:

```powershell
npm run typecheck
```

Run linting:

```powershell
npm run lint
```

Run the build:

```powershell
npm run build
```

Run the repository secret scan:

```powershell
npm run scan:secrets
```

Useful focused commands:

```powershell
npx vitest run apps/api/test/document-ingestion.test.ts
npx vitest run apps/api/test/qa.test.ts
npx vitest run apps/api/test/pipeline-security.test.ts
```

## Documentation

The repository includes the following design documents:

- [01-product-requirements.md](./01-product-requirements.md): product goals, users, use cases, and requirements.
- [02-technical-requirements.md](./02-technical-requirements.md): architecture, security, AI provider interfaces,
  retrieval, and operational requirements.
- [03-ui-ux-design.md](./03-ui-ux-design.md): interface patterns,
  accessibility, content hierarchy, and visual rules.
- [04-application-flow.md](./04-application-flow.md): user journeys and processing states.
- [05-backend-schema.md](./05-backend-schema.md): entities, relationships,
  statuses, and persistence design.
- [06-implementation-plan.md](./06-implementation-plan.md): implementation
  phases, quality gates, and delivery checklist.

## License and legal notice

See the repository license files and project policies before distributing or
deploying the application. ClauseIQX is an informational document
assistance system and is not a law firm, attorney, or substitute for
professional legal advice.
