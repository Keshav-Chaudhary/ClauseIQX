/**
 * Documents service barrel export.
 * Re-exports ingestion pipeline and types.
 */

export { ingestDocument } from './ingestion';
export type { IngestDocumentParams, IngestDocumentResult } from './ingestion';
export { extractUploadErrorMessage, markDocumentFailed } from './validation';
export { createScanFailedAuditEvent, createIngestionAuditEvent } from './audit';
