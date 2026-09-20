import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { authorizeProject } from '../middleware/auth';
import { dataStore } from '../services/store';
import { ingestDocument } from '../services/documents';
import { createNotFoundOrForbiddenError, createValidationError } from '@clauseiqx/security';
import { z } from 'zod';
import { analysisRouter } from './analysis';
import { controlCenterRouter } from './control-center';

export const documentsRouter = Router({ mergeParams: true });

// Mount nested analysis and control-center routes
documentsRouter.use('/:documentId/analyses', analysisRouter);
documentsRouter.use('/:documentId/control-center', controlCenterRouter);

// Schema for document upload payload
const UploadDocumentBodySchema = z.object({
  filename: z.string().min(1).max(255),
  mediaType: z.string().min(1),
  contentBase64: z.string().optional(),
  text: z.string().optional(),
});

/**
 * POST /api/v1/projects/:projectId/documents
 * Securely uploads, scans, extracts, and chunks a legal document.
 */
documentsRouter.post(
  '/',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const rawProjectId = req.params.projectId;
      const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

      const parsed = UploadDocumentBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const err = createValidationError(
          `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const { filename, mediaType, contentBase64, text } = parsed.data;

      // Extract file buffer from base64 or raw text
      let fileBuffer: Buffer;
      if (contentBase64) {
        fileBuffer = Buffer.from(contentBase64, 'base64');
      } else if (text !== undefined) {
        fileBuffer = Buffer.from(text, 'utf-8');
      } else {
        const err = createValidationError(
          'Either contentBase64 or text must be provided for document upload.',
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const result = await ingestDocument({
        projectId,
        userId: req.user!.id,
        filename,
        mediaType,
        fileBuffer,
        requestId: req.requestId,
      });

      res.status(201).json({
        document: result.document,
        version: result.version,
        chunks_count: result.chunks.length,
        ocr_confidence: result.ocrConfidence ?? 0.98,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const isClientUploadError =
        /file extension|executable files|magic bytes|mime type|maximum file size|file size exceeds|HTML or script|security scan detected threat/i.test(
          message
        );

      if (isClientUploadError) {
        const err = createValidationError(message, req.requestId);
        res.status(err.statusCode).json(err.payload);
        return;
      }

      _next(error);
    }
  }
);

/**
 * GET /api/v1/projects/:projectId/documents
 * Lists all active documents in the project.
 */
documentsRouter.get(
  '/',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    const documents = dataStore.findDocumentsForProject(projectId);
    res.json({ documents });
  }
);

/**
 * GET /api/v1/projects/:projectId/documents/:documentId
 * Fetches a single document's metadata and version.
 */
documentsRouter.get(
  '/:documentId',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawDocId = req.params.documentId;
    const documentId = Array.isArray(rawDocId) ? rawDocId[0] : rawDocId;

    const doc = dataStore.findDocumentById(documentId);
    if (!doc || doc.project_id !== projectId) {
      const err = createNotFoundOrForbiddenError('Document', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const latestVersion = dataStore.getLatestDocumentVersion(documentId);
    res.json({
      document: doc,
      latest_version: latestVersion,
    });
  }
);

/**
 * GET /api/v1/projects/:projectId/documents/:documentId/chunks
 * Fetches chunked sections with citation metadata.
 */
documentsRouter.get(
  '/:documentId/chunks',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawDocId = req.params.documentId;
    const documentId = Array.isArray(rawDocId) ? rawDocId[0] : rawDocId;

    const doc = dataStore.findDocumentById(documentId);
    if (!doc || doc.project_id !== projectId) {
      const err = createNotFoundOrForbiddenError('Document', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const version = dataStore.getLatestDocumentVersion(documentId);
    if (!version) {
      res.json({ chunks: [] });
      return;
    }

    const chunks = dataStore.findChunksForVersion(version.id);
    res.json({ chunks });
  }
);

/**
 * DELETE /api/v1/projects/:projectId/documents/:documentId
 * Soft-deletes a document idempotently (App Flow §9 & Backend Schema §20).
 */
documentsRouter.delete(
  '/:documentId',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawDocId = req.params.documentId;
    const documentId = Array.isArray(rawDocId) ? rawDocId[0] : rawDocId;

    const doc = dataStore.findDocumentById(documentId);
    if (!doc || doc.project_id !== projectId) {
      const err = createNotFoundOrForbiddenError('Document', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    dataStore.softDeleteDocument(documentId);

    dataStore.createAuditEvent('document.deleted', {
      actorUserId: req.user!.id,
      projectId,
      resourceType: 'document',
      resourceId: documentId,
      requestId: req.requestId,
      metadata: {
        filename: doc.filename,
      },
    });

    res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  }
);
