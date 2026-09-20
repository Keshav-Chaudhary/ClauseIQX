import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dataStore } from '../services/store';
import { requireAuth, authorizeProject } from '../middleware/auth';
import { authenticatedRateLimitMiddleware } from '../middleware/rate-limit';
import { validateRequest } from '../middleware/validate';
import { createNotFoundOrForbiddenError } from '@clauseiqx/security';
import { documentsRouter } from './documents';
import { conversationsRouter } from './conversations';
import { comparisonsRouter } from './comparisons';
import { lawyerPrepRouter } from './lawyer-prep';
import { exportsRouter } from './exports';

export const projectsRouter = Router();

// All project routes require authentication
projectsRouter.use(requireAuth);
projectsRouter.use(authenticatedRateLimitMiddleware);

// Mount nested document, conversation, comparison, lawyer prep, and exports routes
projectsRouter.use('/:projectId/documents', documentsRouter);
projectsRouter.use('/:projectId/conversations', conversationsRouter);
projectsRouter.use('/:projectId/comparisons', comparisonsRouter);
projectsRouter.use('/:projectId/lawyer-prep', lawyerPrepRouter);
projectsRouter.use('/:projectId/exports', exportsRouter);

// ==========================================
// 1. CREATE PROJECT
// ==========================================

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name cannot be empty').max(255),
  jurisdictionCode: z.string().max(50).optional().nullable(),
  documentType: z.string().max(100).optional().nullable(),
}).strict();

projectsRouter.post(
  '/',
  validateRequest({ body: createProjectSchema }),
  (req: Request, res: Response) => {
    const { name, jurisdictionCode, documentType } = req.body;
    const userId = req.user!.id;

    const project = dataStore.createProject(userId, name, jurisdictionCode, documentType);

    dataStore.createAuditEvent('project.created', {
      actorUserId: userId,
      projectId: project.id,
      requestId: req.requestId,
      resourceType: 'project',
      resourceId: project.id,
      metadata: {
        jurisdiction: project.jurisdiction_code,
        documentType: project.document_type,
      },
    });

    res.status(201).json({
      status: 'ok',
      project,
    });
  }
);

// ==========================================
// 2. LIST PROJECTS FOR USER
// ==========================================

projectsRouter.get('/', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projects = dataStore.findProjectsForUser(userId);

  res.status(200).json({
    status: 'ok',
    projects,
  });
});

// ==========================================
// 3. GET PROJECT DETAILS
// ==========================================

projectsRouter.get(
  '/:projectId',
  authorizeProject('viewer'),
  (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      project: req.project,
      role: req.projectRole,
    });
  }
);

// ==========================================
// 4. UPDATE PROJECT
// ==========================================

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  jurisdictionCode: z.string().max(50).optional().nullable(),
  documentType: z.string().max(100).optional().nullable(),
}).strict();

projectsRouter.patch(
  '/:projectId',
  authorizeProject('member'),
  validateRequest({ body: updateProjectSchema }),
  (req: Request, res: Response) => {
    const { name, jurisdictionCode, documentType } = req.body;
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    const updated = dataStore.updateProject(projectId, {
      name,
      jurisdiction_code: jurisdictionCode,
      document_type: documentType,
    });

    if (!updated) {
      const err = createNotFoundOrForbiddenError('Project', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    dataStore.createAuditEvent('project.updated', {
      actorUserId: req.user!.id,
      projectId,
      requestId: req.requestId,
      resourceType: 'project',
      resourceId: projectId,
    });

    res.status(200).json({
      status: 'ok',
      project: updated,
    });
  }
);

// ==========================================
// 5. DELETE PROJECT (Soft-delete & Audit)
// ==========================================

projectsRouter.delete(
  '/:projectId',
  authorizeProject('owner'),
  (req: Request, res: Response) => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    dataStore.softDeleteProject(projectId);

    dataStore.createAuditEvent('project.deleted', {
      actorUserId: req.user!.id,
      projectId,
      requestId: req.requestId,
      resourceType: 'project',
      resourceId: projectId,
    });

    res.status(200).json({
      status: 'ok',
      message: 'Project deleted successfully.',
    });
  }
);
