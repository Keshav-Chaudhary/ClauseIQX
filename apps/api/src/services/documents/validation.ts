/**
 * Document validation utilities for the ingestion pipeline.
 * Handles upload result validation and document status transitions
 * (04_App_Flow.md §4).
 */

import { dataStore } from '../store';

/**
 * Extracts a user-facing error message from an upload safety result.
 */
export function extractUploadErrorMessage(
  uploadError: unknown
): string {
  if (
    typeof uploadError === 'object' &&
    uploadError !== null &&
    'error' in uploadError &&
    typeof (uploadError as { error: { message: string } }).error?.message === 'string'
  ) {
    return (uploadError as { error: { message: string } }).error.message;
  }
  return 'Uploaded file failed safety validation';
}

/**
 * Marks a document as FAILED and soft-deletes it.
 */
export function markDocumentFailed(
  documentId: string,
  additionalUpdates: Record<string, unknown> = {}
): void {
  dataStore.updateDocument(documentId, { status: 'FAILED', ...additionalUpdates });
  dataStore.softDeleteDocument(documentId);
}
