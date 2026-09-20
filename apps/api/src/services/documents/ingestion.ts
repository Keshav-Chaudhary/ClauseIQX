/**
 * Document ingestion orchestrator.
 * Coordinates the full document ingestion pipeline:
 * upload → validate → scan → extract → chunk → embed → ready
 * (04_App_Flow.md §4)
 */

import { dataStore } from '../store';
import {
  globalStorage,
  globalMalwareScanner,
  globalOCRProvider,
  globalEmbeddingProvider,
} from '../providers';
import { processSafeUpload } from '../../middleware/upload-safety';
import { chunkDocumentText } from '../chunking';
import { Document, DocumentVersion, DocumentChunk } from '@clauseiqx/shared-types';
import { extractUploadErrorMessage } from './validation';
import { createScanFailedAuditEvent, createIngestionAuditEvent } from './audit';

export interface IngestDocumentParams {
  projectId: string;
  userId: string;
  filename: string;
  mediaType: string;
  fileBuffer: Buffer;
  requestId?: string;
}

export interface IngestDocumentResult {
  document: Document;
  version: DocumentVersion;
  chunks: DocumentChunk[];
  ocrConfidence?: number;
}

/**
 * Orchestrates secure document ingestion according to 04_App_Flow.md §4:
 * 1. Upload & Basic Validation
 * 2. Magic byte / MIME / size security validation
 * 3. Quarantine storage
 * 4. Malware scan (fails safely with 0 partial processing if infected)
 * 5. Text extraction & OCR
 * 6. Section detection, normalization & chunking
 * 7. Embedding generation
 * 8. Status update to READY
 */
export async function ingestDocument(
  params: IngestDocumentParams
): Promise<IngestDocumentResult> {
  const { projectId, userId, filename, mediaType, fileBuffer, requestId = 'req-ingest' } = params;

  // 1. Initial Document Record in UPLOADING state
  const doc = dataStore.createDocument({
    projectId,
    uploadedByUserId: userId,
    filename,
    mediaType,
    byteSize: fileBuffer.length,
    sha256: 'pending',
    status: 'UPLOADING',
    scanStatus: 'PENDING',
  });

  try {
    // 2. Magic byte validation & safe upload to isolated storage
    const uploadResult = await processSafeUpload(
      fileBuffer,
      filename,
      mediaType,
      globalStorage,
      {},
      requestId
    );

    if (!uploadResult.success) {
      dataStore.updateDocument(doc.id, { status: 'FAILED', scan_status: 'FAILED' });
      throw new Error(extractUploadErrorMessage(uploadResult.error));
    }

    const { storageObjectKey, sha256, mediaType: detectedMime } = uploadResult.upload;
    doc.sha256 = sha256;
    doc.media_type = detectedMime;
    dataStore.updateDocument(doc.id, {
      status: 'QUARANTINED',
      storage_object_key: storageObjectKey,
      media_type: detectedMime,
    });

    // 3. Malware Scan Stage
    dataStore.updateDocument(doc.id, { status: 'SCANNING' });
    const scanResult = await globalMalwareScanner.scan(fileBuffer, filename);

    if (!scanResult.isClean) {
      // Mark as infected, delete quarantined storage copy, abort completely (no partial processing)
      dataStore.updateDocument(doc.id, {
        status: 'FAILED',
        scan_status: 'INFECTED',
      });
      dataStore.softDeleteDocument(doc.id);
      await globalStorage.delete(storageObjectKey);

      createScanFailedAuditEvent({
        userId,
        projectId,
        documentId: doc.id,
        requestId,
        threatName: scanResult.threatName,
        filename,
      });

      throw new Error(`Security scan detected threat: ${scanResult.threatName || 'Malware detected'}`);
    }

    dataStore.updateDocument(doc.id, {
      status: 'PROCESSING',
      scan_status: 'CLEAN',
    });

    // 4. Text Extraction & OCR
    const ocrResult = await globalOCRProvider.extract(fileBuffer, detectedMime);

    // 5. Create Document Version 1
    const version = dataStore.createDocumentVersion({
      documentId: doc.id,
      versionNumber: 1,
      contentSha256: sha256,
      extractorVersion: globalOCRProvider.getProviderName(),
      extractionStatus: 'completed',
    });

    // 6. Section Detection & Chunking
    const chunks = chunkDocumentText(version.id, ocrResult.text, ocrResult.pages);
    dataStore.createDocumentChunks(chunks);

    // 7. Embeddings Generation
    if (chunks.length > 0) {
      const chunkTexts = chunks.map((c) => `${c.section_title || ''}\n${c.text_content}`);
      const embeddings = await globalEmbeddingProvider.embed(chunkTexts);
      const modelName = globalEmbeddingProvider.getModelName();

      for (let i = 0; i < chunks.length; i++) {
        dataStore.saveDocumentEmbedding(chunks[i].id, modelName, embeddings[i]);
      }
    }

    // 8. Mark Document as READY
    dataStore.updateDocument(doc.id, {
      status: 'READY',
      page_count: ocrResult.pageCount,
    });

    createIngestionAuditEvent({
      userId,
      projectId,
      documentId: doc.id,
      requestId,
      filename,
      pageCount: ocrResult.pageCount,
      chunkCount: chunks.length,
    });

    return {
      document: dataStore.findDocumentById(doc.id)!,
      version,
      chunks,
      ocrConfidence: ocrResult.overallConfidence,
    };
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    dataStore.updateDocument(doc.id, { status: 'FAILED' });
    dataStore.softDeleteDocument(doc.id);
    throw errorObj;
  }
}
