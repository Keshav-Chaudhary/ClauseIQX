import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.header('X-Request-Id');
  const requestId = existingId && /^[a-zA-Z0-9-_]{1,64}$/.test(existingId)
    ? existingId
    : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
