import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { config } from '../config.js';

export const SESSION_COOKIE_NAME = 'gsm_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionRecord {
  expiresAt: number;
}

/** In-memory session store (single-process deployments). */
const sessions = new Map<string, SessionRecord>();

function signToken(token: string): string | null {
  if (!config.apiSecret) return null;
  return crypto.createHmac('sha256', config.apiSecret).update(token).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const cookies: Record<string, string> = {};
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

export function getSessionCookie(req: Request): string | null {
  const value = parseCookies(req)[SESSION_COOKIE_NAME];
  return typeof value === 'string' && value ? value : null;
}

export function createSession(): string {
  const token = crypto.randomBytes(32).toString('base64url');
  const signature = signToken(token);
  if (!signature) {
    throw new Error('Cannot create session without API_SECRET');
  }
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
  return `${token}.${signature}`;
}

export function validateSession(sessionValue: string | null | undefined): boolean {
  if (!sessionValue || !config.apiSecret) return false;
  const dot = sessionValue.indexOf('.');
  if (dot <= 0) return false;
  const token = sessionValue.slice(0, dot);
  const signature = sessionValue.slice(dot + 1);
  const expected = signToken(token);
  if (!expected || !safeEqual(signature, expected)) return false;

  const record = sessions.get(token);
  if (!record) return false;
  if (record.expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(sessionValue: string | null | undefined): void {
  if (!sessionValue) return;
  const dot = sessionValue.indexOf('.');
  if (dot <= 0) return;
  sessions.delete(sessionValue.slice(0, dot));
}

export function isSecureRequest(req: Request): boolean {
  if (req.secure) return true;
  const forwarded = req.headers['x-forwarded-proto'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim().toLowerCase() === 'https';
  }
  return false;
}

export function setSessionCookie(res: Response, sessionValue: string, req: Request): void {
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionValue)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ];
  if (isSecureRequest(req)) {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response): void {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

/** Test helper — reset in-memory sessions between tests. */
export function clearAllSessionsForTests(): void {
  sessions.clear();
}
