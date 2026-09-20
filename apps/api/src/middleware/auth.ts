import { Request, Response, NextFunction } from 'express';
import { User, Project, UserRole } from '@clauseiqx/shared-types';
import {
  sessionStore,
  createUnauthorizedError,
  createNotFoundOrForbiddenError,
} from '@clauseiqx/security';
import { dataStore } from '../services/store';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      project?: Project;
      projectRole?: UserRole;
    }
  }
}

/**
 * Authentication Middleware
 * Enforces valid session token on protected endpoints.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestId = req.requestId || 'req-auth';
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = createUnauthorizedError(requestId);
    res.status(err.statusCode).json(err.payload);
    return;
  }

  const token = authHeader.substring(7).trim();
  const session = await Promise.resolve(sessionStore.validateSession(token));

  if (!session) {
    const err = createUnauthorizedError(requestId);
    res.status(err.statusCode).json(err.payload);
    return;
  }

  const user = dataStore.findUserById(session.userId);
  if (!user || user.status !== 'active') {
    const err = createUnauthorizedError(requestId);
    res.status(err.statusCode).json(err.payload);
    return;
  }

  req.user = user;
  next();
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  member: 2,
  owner: 3,
};

/**
 * Server-Side Project Authorization Middleware
 * Enforces that the authenticated user owns or has access to the requested project.
 * Implements non-enumerating 404 error policy: cross-tenant requests return 404
 * rather than leaking project existence.
 */
export function authorizeProject(minimumRole: UserRole = 'viewer') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.requestId || 'req-authz';
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    if (!projectId) {
      const err = createNotFoundOrForbiddenError('Project', requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    if (!req.user) {
      const err = createUnauthorizedError(requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    const project = dataStore.findProjectById(projectId);

    // If project does not exist OR is soft-deleted, return 404
    if (!project) {
      const err = createNotFoundOrForbiddenError('Project', requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    // Determine user's role on the project
    const userRole = dataStore.getUserProjectRole(projectId, req.user.id);

    // Cross-tenant protection: if user is neither owner nor member, return 404 (non-enumerating)
    if (!userRole) {
      const err = createNotFoundOrForbiddenError('Project', requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    // Enforce role hierarchy (e.g. member/owner needed for updates)
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minimumRole]) {
      const err = createNotFoundOrForbiddenError('Project', requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    req.project = project;
    req.projectRole = userRole;
    next();
  };
}
