import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@clauseiqx/shared-types';
import { AppSecurityException, sanitizeErrorMessage } from '@clauseiqx/security';
import { defaultLogger } from '@clauseiqx/logger';

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || 'unknown-request-id';

  // Security / App-specific exceptions
  if (err instanceof AppSecurityException) {
    const responsePayload: ApiError = {
      error: {
        code: err.code,
        message: err.userMessage,
        request_id: requestId,
      },
    };
    res.status(err.statusCode).json(responsePayload);
    return;
  }

  // Generic or unexpected errors
  const isProd = process.env.NODE_ENV === 'production';
  const errorObj = err instanceof Error ? err : new Error(String(err));

  // Log full error details including stack server-side only
  defaultLogger.error('Unhandled request error', {
    requestId,
    method: req.method,
    path: req.path,
  }, errorObj);

  // Always sanitize message so no paths, SQL syntax, or stack traces leak to users
  const safeMessage = isProd
    ? 'An unexpected error occurred while processing your request.'
    : sanitizeErrorMessage(errorObj.message);

  const responsePayload: ApiError = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: safeMessage,
      request_id: requestId,
    },
  };

  res.status(500).json(responsePayload);
}
