import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middleware/request-id';
import { errorHandlerMiddleware } from './middleware/error-handler';
import { healthRouter } from './routes/health';
import { openApiSpec } from './openapi';
import { createNotFoundOrForbiddenError } from '@clauseiqx/security';
import { defaultLogger } from '@clauseiqx/logger';
import { loadConfig } from './config';

import { publicRateLimitMiddleware } from './middleware/rate-limit';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';
import { metricsRouter } from './routes/metrics';

export function createApp(): Express {
  const app = express();

  const config = loadConfig();
  const allowedOrigins = config.CORS_ORIGINS.split(',').map(o => o.trim()).filter(o => o.length > 0);
  const corsOrigin = allowedOrigins.includes('*') ? true : allowedOrigins;
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: '50mb' }));
  app.use(requestIdMiddleware);

  // Request logging middleware (excluding sensitive body contents)
  app.use((req: Request, _res: Response, next) => {
    defaultLogger.info(`${req.method} ${req.path}`, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
    });
    next();
  });

  // Apply public rate limiting to public endpoints
  app.use('/health', publicRateLimitMiddleware);
  app.use('/api/v1/health', publicRateLimitMiddleware);
  app.use('/api/v1/metrics', publicRateLimitMiddleware);
  app.use('/api/docs.json', publicRateLimitMiddleware);

  // OpenAPI spec route
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  // Health check routes
  app.use(healthRouter);

  // Auth, Project, & Observability Routes
  app.use('/api/v1/auth', authRouter);
  // Apply per-user rate limiting to all authenticated project endpoints
  app.use('/api/v1/projects', projectsRouter);
  app.use('/api/v1/metrics', metricsRouter);

  // Route to trigger deliberate errors for testing error sanitization & non-leakage
  if (config.NODE_ENV !== 'production') {
    app.get('/api/v1/test/trigger-leak-error', (_req: Request, _res: Response) => {
      const errorType = _req.query.type as string;
      if (errorType === 'db') {
        throw new Error('relation "users" does not exist at character 15 in SELECT * FROM users');
      }
      if (errorType === 'path') {
        throw new Error('Failed to read file at C:\\Users\\Polak\\Downloads\\internal\\secret.key');
      }
      throw new Error('Generic unhandled internal failure');
    });
  }

  // Fallback 404 handler with non-enumerating error contract
  app.use((req: Request, res: Response) => {
    const errorResponse = createNotFoundOrForbiddenError('Route', req.requestId);
    res.status(errorResponse.statusCode).json(errorResponse.payload);
  });

  // Global exception filter
  app.use(errorHandlerMiddleware);

  return app;
}
