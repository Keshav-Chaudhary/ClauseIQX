import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, authorizeProject } from '../middleware/auth';
import { dataStore } from '../services/store';
import { generateDocumentAnalysis } from '../services/analysis';
import { createNotFoundOrForbiddenError, createValidationError } from '@clauseiqx/security';
import { AnalysisTypeSchema } from '@clauseiqx/shared-types';
import { z } from 'zod';

export const analysisRouter = Router({ mergeParams: true });

const CreateAnalysisBodySchema = z.object({
  analysisType: AnalysisTypeSchema,
  readingLevel: z.enum(['simple', 'detailed']).optional(),
  forceIncompleteForTesting: z.boolean().optional(),
});

/**
 * POST /api/v1/projects/:projectId/documents/:documentId/analyses
 * Triggers structured document analysis with mandatory citation validation.
 */
analysisRouter.post(
  '/',
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

      const parsed = CreateAnalysisBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const err = createValidationError(
          `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const result = await generateDocumentAnalysis({
        documentId,
        analysisType: parsed.data.analysisType,
        readingLevel: parsed.data.readingLevel,
        forceIncompleteForTesting: parsed.data.forceIncompleteForTesting,
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

/**
 * GET /api/v1/projects/:projectId/documents/:documentId/analyses
 * Lists all analyses for a document with optional type filtering and findings attachment.
 */
analysisRouter.get(
  '/',
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

    const typeQuery = req.query.type as string | undefined;
    const includeFindings = req.query.include_findings === 'true';

    let analyses = dataStore.findAnalysesForDocument(documentId);
    if (typeQuery) {
      analyses = analyses.filter((a) => a.analysis_type === typeQuery);
    }

    if (includeFindings) {
      const analysesWithFindings = analyses.map((a) => ({
        ...a,
        findings: dataStore.findFindingsForAnalysis(a.id),
      }));
      res.json({ analyses: analysesWithFindings });
      return;
    }

    res.json({ analyses });
  }
);

/**
 * GET /api/v1/projects/:projectId/documents/:documentId/analyses/:analysisId
 * Fetches a single analysis and all its cited findings.
 */
analysisRouter.get(
  '/:analysisId',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawDocId = req.params.documentId;
    const documentId = Array.isArray(rawDocId) ? rawDocId[0] : rawDocId;
    const rawAnalysisId = req.params.analysisId;
    const analysisId = Array.isArray(rawAnalysisId) ? rawAnalysisId[0] : rawAnalysisId;

    const doc = dataStore.findDocumentById(documentId);
    if (!doc || doc.project_id !== projectId) {
      const err = createNotFoundOrForbiddenError('Document', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const analysis = dataStore.findAnalysisById(analysisId);
    if (!analysis || analysis.document_id !== documentId) {
      const err = createNotFoundOrForbiddenError('Analysis', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const findings = dataStore.findFindingsForAnalysis(analysisId);
    res.json({
      analysis,
      findings,
    });
  }
);
