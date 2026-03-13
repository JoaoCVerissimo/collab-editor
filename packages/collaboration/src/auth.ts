import jwt from 'jsonwebtoken';
import type { AuthPayload } from '@collab-editor/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret';

export function verifyToken(token: string): AuthPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return payload;
  } catch {
    return null;
  }
}
