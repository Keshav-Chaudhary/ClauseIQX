import { defaultLogger } from '@clauseiqx/logger';
import {
  MalwareScanner,
  OCRProvider,
  EmbeddingProvider,
  ObjectStorage,
} from '@clauseiqx/ai';
import { JobStatus, DocumentStatus } from '@clauseiqx/shared-types';

export interface ProcessingPipelineOptions {
  malwareScanner: MalwareScanner;
  ocrProvider: OCRProvider;
  embeddingProvider: EmbeddingProvider;
  objectStorage: ObjectStorage;
}

export interface DocumentJobPayload {
  documentId: string;
  projectId: string;
  storageObjectKey: string;
  filename: string;
  mediaType: string;
}

export class DocumentProcessingWorker {
  private options: ProcessingPipelineOptions;

  constructor(options: ProcessingPipelineOptions) {
    this.options = options;
  }

  /**
   * Executes the staged processing pipeline:
   * Staged text per 03_UIUX_Design.md §4:
   * "Secure upload → Security check → Read document → Organize sections → Prepare analysis."
   */
  async processDocument(
    jobId: string,
    payload: DocumentJobPayload,
    onProgress?: (stage: string, status: DocumentStatus) => void
  ): Promise<{ status: JobStatus; documentStatus: DocumentStatus; error?: string }> {
    const logger = defaultLogger;
    logger.info(`Starting processing job: ${jobId}`, {
      documentId: payload.documentId,
      projectId: payload.projectId,
    });

    try {
      // Stage 1: Security Check (Malware scan)
      onProgress?.('Security check', 'SCANNING');
      const fileBuffer = await this.options.objectStorage.get(payload.storageObjectKey);
      const scanResult = await this.options.malwareScanner.scan(fileBuffer, payload.filename);

      if (!scanResult.isClean) {
        logger.warn(`Document failed malware scan: ${jobId}`, {
          threatName: scanResult.threatName,
        });
        return {
          status: 'FAILED',
          documentStatus: 'FAILED',
          error: `Security scan detected threat: ${scanResult.threatName}`,
        };
      }

      // Stage 2: Read document (Extraction / OCR)
      onProgress?.('Read document', 'PROCESSING');
      const extractResult = await this.options.ocrProvider.extract(fileBuffer, payload.mediaType);

      // Stage 3: Organize sections & Chunking
      onProgress?.('Organize sections', 'PROCESSING');
      // In Phase 3, this will chunk and embed
      const chunks = [extractResult.text];
      await this.options.embeddingProvider.embed(chunks);

      // Stage 4: Prepare analysis
      onProgress?.('Prepare analysis', 'READY');

      logger.info(`Document processing completed successfully: ${jobId}`, {
        documentId: payload.documentId,
      });

      return {
        status: 'SUCCEEDED',
        documentStatus: 'READY',
      };
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      logger.error(`Document processing failed: ${jobId}`, {
        documentId: payload.documentId,
      }, errorObj);

      return {
        status: 'FAILED',
        documentStatus: 'FAILED',
        error: errorObj.message,
      };
    }
  }
}
