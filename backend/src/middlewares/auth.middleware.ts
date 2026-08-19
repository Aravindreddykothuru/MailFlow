import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// ─── JWT payload shape ────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
}

// ─── Extended Request ─────────────────────────────────────────────────────────
// Augment Express Request so downstream handlers can access req.userId safely
// after this middleware has run.
declare global {
  namespace Express {
    interface Request {
      userId: string;
      userEmail: string;
    }
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
/**
 * Verifies the JWT from either:
 *   1. Authorization: Bearer <token>  header (for API clients)
 *   2. session (httpOnly cookie) set by the OAuth callback
 *
 * Attaches req.userId and req.userEmail so controllers don't need to
 * re-validate or re-decode.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // Fall back to httpOnly cookie
  if (!token && req.cookies?.session) {
    token = req.cookies.session as string;
  }

  if (!token) {
    res.status(401).json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ ok: false, error: { code: 'INVALID_TOKEN', message: 'Session expired. Please sign in again.' } });
  }
}
