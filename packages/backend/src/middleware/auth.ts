import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { AuthPayload } from '@collab-editor/shared';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    userEmail?: string;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
