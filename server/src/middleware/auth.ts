import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { getSessionCookie, validateSession } from '../services/session.js';

let warnedOnce = false;

function isPublicRoute(req: Request): boolean {
  if (req.method === 'GET' && req.path === '/health') return true;
  if (req.method === 'POST' && req.path === '/auth/login') return true;
  if (req.method === 'GET' && req.path === '/auth/session') return true;
  return false;
}

function safeCompareSecret(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

function hasValidBearer(req: Request): boolean {
  if (!config.apiSecret) return false;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return safeCompareSecret(token, config.apiSecret);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isPublicRoute(req)) {
    next();
    return;
  }

  // Dev mode: no API_SECRET set — allow all requests (fullstack dev should still set secret).
  if (!config.apiSecret) {
    if (!warnedOnce) {
      console.warn('⚠️  API_SECRET not set — auth disabled (dev mode)');
      warnedOnce = true;
    }
    next();
    return;
  }

  if (validateSession(getSessionCookie(req))) {
    next();
    return;
  }

  if (hasValidBearer(req)) {
    next();
    return;
  }

  res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
}
