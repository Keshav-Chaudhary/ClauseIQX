/**
 * Audit event creation for document ingestion pipeline.
 * Separates telemetry/logging concerns from business logic
 * (04_App_Flow.md §4).
 */

import { dataStore } from '../store';
import { defaultLogger } from '@clauseiqx/logger';

/**
 * Records an audit event when a malware scan detects a threat.
 */
export function createScanFailedAuditEvent(params: {
  userId: string;
  projectId: string;
  documentId: string;
  requestId: string;
  threatName?: string;
  filename: string;
}): void {
  dataStore.createAuditEvent('document.scan_failed', {
    actorUserId: params.userId,
    projectId: params.projectId,
    resourceType: 'document',
    resourceId: params.documentId,
    requestId: params.requestId,
    metadata: {
      threatName: params.threatName,
      filename: params.filename,
    },
  });
}

/**
 * Records an audit event when a document is successfully ingested.
 */
export function createIngestionAuditEvent(params: {
  userId: string;
  projectId: string;
  documentId: string;
  requestId: string;
  filename: string;
  pageCount: number;
  chunkCount: number;
}): void {
  dataStore.createAuditEvent('document.uploaded', {
    actorUserId: params.userId,
    projectId: params.projectId,
    resourceType: 'document',
    resourceId: params.documentId,
    requestId: params.requestId,
    metadata: {
      filename: params.filename,
      pageCount: params.pageCount,
      chunkCount: params.chunkCount,
    },
  });

  defaultLogger.info(`Document successfully ingested: ${params.documentId}`, {
    projectId: params.projectId,
    documentId: params.documentId,
    pageCount: params.pageCount,
    chunkCount: params.chunkCount,
  });
}
