import jwt from 'jsonwebtoken';
import type { AuthPayload } from '@collab-editor/shared';

export function verifyToken(token: string): AuthPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'local-dev-secret';
    const payload = jwt.verify(token, secret) as AuthPayload;
    return payload;
  } catch {
    return null;
  }
}
