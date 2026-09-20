# 11 — Efficiency, Performance & Scalability
## Product: ClauseIQX — Legal Document Intelligence

**Version:** 2.0  
**Audit Reference:** [EFFICIENCY.md](./EFFICIENCY.md)  
**Status:** Highly Optimized Static Export & Fast RAG Retrieval  

---

## 1. Performance Architecture

ClauseIQX is engineered for speed and responsiveness across high-volume document workflows:

1. **Static Edge Delivery:** The web application compiles via Next.js Turbopack into static pre-rendered pages, served globally via Firebase CDN with multi-year static asset caching (`Cache-Control: max-age=31536000`).
2. **Low-Latency RAG Retrieval:** Embeddings are indexed using PostgreSQL `pgvector` (IVFFlat/HNSW). Queries are strictly scoped to project and document IDs, eliminating expensive full-table scans.
3. **Token-Conscious Chunking:** Documents are split into semantic section chunks rather than raw arbitrary token windows, ensuring LLM queries receive only the most relevant passages and preserving API token budgets.
4. **Zero Heavy Runtime Overheads:** The frontend uses a custom Vanilla CSS design system with CSS custom properties, achieving instant render times without bulky CSS-in-JS runtimes.

---

## 2. Resource & Caching Strategies

| Layer | Optimization Strategy | Latency Target |
|---|---|---|
| **Frontend Assets** | Static HTML/CSS/JS export on Firebase CDN with immutable cache headers | <50ms TTFB |
| **API Endpoints** | Lightweight Express 5 router with non-blocking async handlers | <20ms execution |
| **Session Cache** | Fast key-value lookups in Redis memory | <2ms |
| **Vector Retrieval** | Scoped `pgvector` nearest-neighbor search | <15ms |
| **Document Streaming** | Chunked stream processing for uploads and downloads (no full-file heap buffering) | O(1) memory overhead |

---

## 3. Database Connection Pooling

The PostgreSQL connection adapter (`pg`) utilizes managed pooling with configurable bounds (`DATABASE_POOL_MIN` and `DATABASE_POOL_MAX`), preventing connection exhaustion under concurrent API workloads.
