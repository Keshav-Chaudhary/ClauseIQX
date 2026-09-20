import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { createValidationError } from '@clauseiqx/security';

export interface ValidationSchemas {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

export function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.') || 'root';
    return `Field '${path}': ${issue.message}`;
  });
  return issues.join('; ');
}

/**
 * Strict request validation middleware.
 * Validates inputs against schemas (type, length, format) and rejects
 * any payload that does not match with HTTP 400 Bad Request.
 */
export function validateRequest(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || 'unknown-request-id';

    // 1. Validate URL Params
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        const message = formatZodError(result.error);
        const err = createValidationError(message, requestId);
        res.status(err.statusCode).json(err.payload);
        return;
      }
      req.params = result.data;
    }

    // 2. Validate Query Parameters
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        const message = formatZodError(result.error);
        const err = createValidationError(message, requestId);
        res.status(err.statusCode).json(err.payload);
        return;
      }
      req.query = result.data;
    }

    // 3. Validate Request Body
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        const message = formatZodError(result.error);
        const err = createValidationError(message, requestId);
        res.status(err.statusCode).json(err.payload);
        return;
      }
      req.body = result.data;
    }

    next();
  };
}
