import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, authorizeProject } from '../middleware/auth';
import { dataStore } from '../services/store';
import { generateLawyerPrepDraft } from '../services/lawyer-prep';
import { createNotFoundOrForbiddenError, createValidationError } from '@clauseiqx/security';
import { LawyerPrepDraftStatusSchema } from '@clauseiqx/shared-types';
import { z } from 'zod';

export const lawyerPrepRouter = Router({ mergeParams: true });

const CreateDraftBodySchema = z.object({
  userNotes: z.string().max(10000).optional(),
});

const UpdateDraftBodySchema = z.object({
  situationSummary: z.string().optional(),
  keyClauses: z.record(z.unknown()).optional(),
  keyDates: z.record(z.unknown()).optional(),
  factsStillNeeded: z.record(z.unknown()).optional(),
  questionsForLawyer: z.record(z.unknown()).optional(),
  userNotes: z.string().max(10000).optional(),
  status: LawyerPrepDraftStatusSchema.optional(),
});

/**
 * POST /api/v1/projects/:projectId/lawyer-prep
 * Generates an editable preparation briefing for a lawyer consultation.
 */
lawyerPrepRouter.post(
  '/',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawProjectId = req.params.projectId;
      const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

      const parsed = CreateDraftBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const err = createValidationError(
          `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const draft = await generateLawyerPrepDraft({
        projectId,
        userId: req.user!.id,
        userNotes: parsed.data.userNotes,
      });

      res.status(201).json({ draft });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/projects/:projectId/lawyer-prep
 * Lists all lawyer prep drafts for the project.
 */
lawyerPrepRouter.get(
  '/',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    const drafts = dataStore.findLawyerPrepDraftsForProject(projectId);
    res.json({ drafts });
  }
);

/**
 * GET /api/v1/projects/:projectId/lawyer-prep/:draftId
 * Fetches a single lawyer prep draft.
 */
lawyerPrepRouter.get(
  '/:draftId',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawDraftId = req.params.draftId;
    const draftId = Array.isArray(rawDraftId) ? rawDraftId[0] : rawDraftId;

    const draft = dataStore.findLawyerPrepDraftById(draftId);
    if (!draft || draft.project_id !== projectId) {
      const err = createNotFoundOrForbiddenError('LawyerPrepDraft', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    res.json({ draft });
  }
);

/**
 * PATCH /api/v1/projects/:projectId/lawyer-prep/:draftId
 * Edits a lawyer prep draft before consultation or export.
 */
lawyerPrepRouter.patch(
  '/:draftId',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawDraftId = req.params.draftId;
    const draftId = Array.isArray(rawDraftId) ? rawDraftId[0] : rawDraftId;

    const existing = dataStore.findLawyerPrepDraftById(draftId);
    if (!existing || existing.project_id !== projectId) {
      const err = createNotFoundOrForbiddenError('LawyerPrepDraft', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const parsed = UpdateDraftBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const err = createValidationError(
        `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
        req.requestId
      );
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const updated = dataStore.updateLawyerPrepDraft(draftId, {
      situation_summary: parsed.data.situationSummary,
      key_clauses: parsed.data.keyClauses,
      key_dates: parsed.data.keyDates,
      facts_still_needed: parsed.data.factsStillNeeded,
      questions_for_lawyer: parsed.data.questionsForLawyer,
      user_notes: parsed.data.userNotes,
      status: parsed.data.status,
    });

    res.json({ draft: updated });
  }
);
