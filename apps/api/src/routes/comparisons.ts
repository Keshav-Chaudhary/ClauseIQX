import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, authorizeProject } from '../middleware/auth';
import { dataStore } from '../services/store';
import { compareDocuments } from '../services/comparison';
import { createNotFoundOrForbiddenError, createValidationError } from '@clauseiqx/security';
import { z } from 'zod';

export const comparisonsRouter = Router({ mergeParams: true });

const CreateComparisonBodySchema = z.object({
  documentAId: z.string().uuid(),
  documentBId: z.string().uuid(),
});

/**
 * POST /api/v1/projects/:projectId/comparisons
 * Compares two distinct documents and produces structural diff with dual-source citations.
 */
comparisonsRouter.post(
  '/',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawProjectId = req.params.projectId;
      const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

      const parsed = CreateComparisonBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const err = createValidationError(
          `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const { documentAId, documentBId } = parsed.data;

      // Invariant: Two distinct documents
      if (documentAId === documentBId) {
        const err = createValidationError(
          'Comparison requires two distinct documents (document_a_id <> document_b_id).',
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      // Verify both documents exist and belong to the project (cross-tenant safety)
      const docA = dataStore.findDocumentById(documentAId);
      const docB = dataStore.findDocumentById(documentBId);

      if (!docA || docA.project_id !== projectId || !docB || docB.project_id !== projectId) {
        const err = createNotFoundOrForbiddenError('Document', req.requestId);
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const result = await compareDocuments({
        projectId,
        documentAId,
        documentBId,
      });

      res.status(201).json({
        comparison: result.comparison,
        changes: result.changes,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/projects/:projectId/comparisons
 * Lists all comparisons in the project.
 */
comparisonsRouter.get(
  '/',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    const comparisons = dataStore.findComparisonsForProject(projectId);
    res.json({ comparisons });
  }
);

/**
 * GET /api/v1/projects/:projectId/comparisons/:comparisonId
 * Fetches a single comparison and all categorized changes with dual citations.
 */
comparisonsRouter.get(
  '/:comparisonId',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawCompId = req.params.comparisonId;
    const comparisonId = Array.isArray(rawCompId) ? rawCompId[0] : rawCompId;

    const comparison = dataStore.findComparisonById(comparisonId);
    if (!comparison || comparison.project_id !== projectId) {
      const err = createNotFoundOrForbiddenError('Comparison', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const changes = dataStore.findChangesForComparison(comparisonId);
    res.json({
      comparison,
      changes,
    });
  }
);
