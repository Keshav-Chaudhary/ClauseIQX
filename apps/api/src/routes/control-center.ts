import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, authorizeProject } from '../middleware/auth';
import { dataStore } from '../services/store';
import { getControlCenterTelemetry, generateControlCenterOverview } from '../services/control-center';
import { createNotFoundOrForbiddenError, createValidationError } from '@clauseiqx/security';
import { z } from 'zod';

export const controlCenterRouter = Router({ mergeParams: true });

const OverviewAnalysisSchema = z.object({
  readingLevel: z.enum(['simple', 'detailed']).optional(),
});

/**
 * GET /api/v1/projects/:projectId/documents/:documentId/control-center/telemetry
 * Fetches autonomous contract telemetry for the Control Center overview dashboard.
 */
controlCenterRouter.get(
  '/telemetry',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      const telemetry = getControlCenterTelemetry(documentId);
      res.json({ telemetry });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/projects/:projectId/documents/:documentId/control-center/analyses
 * Triggers or re-runs executive Control Center synthesis analysis.
 */
controlCenterRouter.post(
  '/analyses',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

      const parsed = OverviewAnalysisSchema.safeParse(req.body);
      if (!parsed.success) {
        const err = createValidationError(
          `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const result = await generateControlCenterOverview({
        documentId,
        readingLevel: parsed.data.readingLevel,
      });

      res.status(201).json({
        analysis: result.analysis,
        findings: result.findings,
        citation_validation_passed: result.citationValidationPassed,
      });
    } catch (error) {
      next(error);
    }
  }
);
