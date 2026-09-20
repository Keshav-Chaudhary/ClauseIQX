import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, authorizeProject } from '../middleware/auth';
import { dataStore } from '../services/store';
import { askQuestion } from '../services/qa';
import { createNotFoundOrForbiddenError, createValidationError } from '@clauseiqx/security';
import { z } from 'zod';

export const conversationsRouter = Router({ mergeParams: true });

const CreateConversationBodySchema = z.object({
  title: z.string().max(255).optional(),
});

const PostMessageBodySchema = z.object({
  content: z.string().min(1, 'Question cannot be empty').max(4000),
  documentId: z.string().uuid().optional(),
});

const DirectQuestionBodySchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(4000),
  documentId: z.string().optional(),
});

/**
 * POST /api/v1/projects/:projectId/conversations/direct
 * Direct Question Answering endpoint for single-question workspace query.
 */
conversationsRouter.post(
  '/direct',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawProjectId = req.params.projectId;
      const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

      const parsed = DirectQuestionBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const err = createValidationError(
          `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      // Reuse or create conversation for user
      const existingConvs = dataStore.findConversationsForProject(projectId, req.user!.id);
      const conv =
        existingConvs.length > 0
          ? existingConvs[0]
          : dataStore.createConversation(projectId, req.user!.id, 'Workspace Q&A');

      const result = await askQuestion({
        projectId,
        conversationId: conv.id,
        userId: req.user!.id,
        question: parsed.data.question,
        documentId: parsed.data.documentId,
        requestId: req.requestId,
      });

      // Map citations to client friendly format
      const citations = (result.assistantMessage.citations || []).map((cit) => {
        const chunk = dataStore.findChunkById(cit.chunk_id);
        return {
          chunkId: cit.chunk_id,
          page: chunk?.page_start || 1,
          snippet: chunk?.text_content.substring(0, 150) || 'Verified contract passage',
        };
      });

      res.status(200).json({
        message: result.assistantMessage,
        user_message: result.userMessage,
        is_high_stakes: result.isHighStakes,
        is_abstained: result.isAbstained,
        reframedNotice: result.isHighStakes
          ? 'Notice: ClauseIQX provides legal information, not legal advice. Analysis is grounded strictly in your uploaded document.'
          : undefined,
        abstained: result.isAbstained,
        citations,
        follow_up_suggestions: result.followUpSuggestions,
        followUpSuggestions: result.followUpSuggestions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/projects/:projectId/conversations
 * Creates a new Q&A conversation thread.
 */
conversationsRouter.post(
  '/',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    const parsed = CreateConversationBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const err = createValidationError(
        `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
        req.requestId
      );
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const conv = dataStore.createConversation(projectId, req.user!.id, parsed.data.title);
    res.status(201).json({ conversation: conv });
  }
);

/**
 * GET /api/v1/projects/:projectId/conversations
 * Lists all conversations in the project for the user.
 */
conversationsRouter.get(
  '/',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    const conversations = dataStore.findConversationsForProject(projectId, req.user!.id);
    res.json({ conversations });
  }
);

/**
 * GET /api/v1/projects/:projectId/conversations/:conversationId
 * Retrieves conversation thread and all messages.
 */
conversationsRouter.get(
  '/:conversationId',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawConvId = req.params.conversationId;
    const conversationId = Array.isArray(rawConvId) ? rawConvId[0] : rawConvId;

    const conv = dataStore.findConversationById(conversationId);
    if (!conv || conv.project_id !== projectId) {
      const err = createNotFoundOrForbiddenError('Conversation', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const messages = dataStore.findMessagesForConversation(conversationId);
    res.json({
      conversation: conv,
      messages,
    });
  }
);

/**
 * POST /api/v1/projects/:projectId/conversations/:conversationId/messages
 * Submits a question and generates a grounded, cited answer.
 */
conversationsRouter.post(
  '/:conversationId/messages',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawProjectId = req.params.projectId;
      const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
      const rawConvId = req.params.conversationId;
      const conversationId = Array.isArray(rawConvId) ? rawConvId[0] : rawConvId;

      const conv = dataStore.findConversationById(conversationId);
      if (!conv || conv.project_id !== projectId) {
        const err = createNotFoundOrForbiddenError('Conversation', req.requestId);
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const parsed = PostMessageBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const err = createValidationError(
          `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const result = await askQuestion({
        projectId,
        conversationId,
        userId: req.user!.id,
        question: parsed.data.content,
        documentId: parsed.data.documentId,
        requestId: req.requestId,
      });

      res.status(201).json({
        message: result.assistantMessage,
        user_message: result.userMessage,
        is_high_stakes: result.isHighStakes,
        is_abstained: result.isAbstained,
        citations_count: result.assistantMessage.citations?.length || 0,
        follow_up_suggestions: result.followUpSuggestions,
        followUpSuggestions: result.followUpSuggestions,
      });
    } catch (error) {
      next(error);
    }
  }
);
