# 12 — Deployment, DevOps & Operations
## Product: ClauseIQX — Legal Document Intelligence

**Version:** 2.0  
**Audit Reference:** [DEPLOYMENT.md](./DEPLOYMENT.md)  
**Status:** Deployed Live & Verified  

---

## 1. Hosting Architecture

ClauseIQX leverages a hybrid architecture combining static edge delivery for the web client with containerized services for the API and background workers:

- **Web Frontend:** Next.js static export hosted on **Firebase Hosting**.
- **Live Production URL:** [https://clauseiqx.web.app](https://clauseiqx.web.app)
- **Local Development Services:** Docker Compose providing PostgreSQL (pgvector), Redis, and MinIO object storage.

---

## 2. One-Command Deployment

The repository is configured with a streamlined root deployment script:

```powershell
npm run deploy
```

This automates:
1. Compiling `@clauseiqx/web` into an optimized static bundle via Next.js Turbopack (`apps/web/out`).
2. Deploying static assets and custom HTTP security headers to Firebase Hosting.
3. Finalizing and releasing the new version globally.

---

## 3. Local Infrastructure with Docker Compose

To launch local development backing services:

```powershell
docker compose -f docker/docker-compose.yml up -d
```

Services provisioned:
- **PostgreSQL + pgvector:** `localhost:5432`
- **Redis Cache & Queue:** `localhost:6379`
- **MinIO S3 Storage API:** `localhost:9000`
- **MinIO Web Console:** `localhost:9001`

Database migrations can then be executed via:
```powershell
npm run migrate
```

---

## 4. Operational Health & Observability

- **Health Endpoint:** `GET /health` returns JSON health status, database ping, and uptime.
- **Metrics Endpoint:** `GET /api/v1/metrics` tracks request counts, latencies, and error rates.
- **Structured Logging:** Centralized JSON logging via `@clauseiqx/logger` without sensitive payload leakage.
