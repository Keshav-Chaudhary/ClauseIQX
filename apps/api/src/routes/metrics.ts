import { Router, Request, Response } from 'express';

export const metricsRouter = Router();

/**
 * GET /api/v1/metrics
 * System observability metrics endpoint (06_Implementation_Plan.md §13)
 */
metricsRouter.get('/', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    process: {
      pid: process.pid,
      node_version: process.version,
      memory: {
        rss_bytes: mem.rss,
        heap_total_bytes: mem.heapTotal,
        heap_used_bytes: mem.heapUsed,
      },
    },
    system_counts: {
      total_audit_events: 0,
      active_storage_driver: 'MockObjectStorage (S3-compatible)',
      active_scanner_driver: 'MockMalwareScanner (ClamAV-compatible)',
      active_ocr_driver: 'MockOCRProvider (Tesseract/Textract-compatible)',
      active_embedding_model: 'mock-text-embedding-3-small (1536-dim)',
    },
  });
});
