import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';
import { encrypt } from '../services/crypto.js';
import { config } from '../config.js';
import { logger } from '../services/logger.js';
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getSessionCookie,
  setSessionCookie,
  validateSession,
} from '../services/session.js';

const router = Router();

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

function hasStoredGitHubToken(): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('github_token') as { value: string } | undefined;
  return !!row?.value;
}

function safeCompareSecret(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'GithubStarsManager-Backend',
      },
    });
    return response.ok;
  } catch (err) {
    logger.warn('auth.github-token', 'GitHub token validation failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

router.post('/api/auth/login', (req, res) => {
  if (!config.apiSecret) {
    res.status(503).json({ error: 'API_SECRET not configured', code: 'AUTH_NOT_CONFIGURED' });
    return;
  }

  const secret = typeof req.body?.secret === 'string' ? req.body.secret : '';
  if (!secret || !safeCompareSecret(secret, config.apiSecret)) {
    res.status(401).json({ error: 'Invalid credentials', code: 'UNAUTHORIZED' });
    return;
  }

  try {
    const sessionValue = createSession();
    setSessionCookie(res, sessionValue, req);
    res.set(NO_STORE_HEADERS).json({ authenticated: true });
  } catch (err) {
    logger.errorFromError('auth.login', 'Failed to create session', err);
    res.status(500).json({ error: 'Failed to create session', code: 'SESSION_CREATE_FAILED' });
  }
});

router.post('/api/auth/logout', (req, res) => {
  destroySession(getSessionCookie(req));
  clearSessionCookie(res);
  res.set(NO_STORE_HEADERS).json({ authenticated: false });
});

router.get('/api/auth/session', (req, res) => {
  const authenticated = validateSession(getSessionCookie(req));
  res.set(NO_STORE_HEADERS).json({
    authenticated,
    hasGitHubToken: hasStoredGitHubToken(),
  });
});

router.post('/api/auth/github-token', async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!token) {
    res.status(400).json({ error: 'token is required', code: 'TOKEN_REQUIRED' });
    return;
  }

  const validate = req.body?.validate !== false;
  if (validate) {
    const ok = await validateGitHubToken(token);
    if (!ok) {
      res.status(400).json({ error: 'Invalid GitHub token', code: 'GITHUB_TOKEN_INVALID' });
      return;
    }
  }

  try {
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run('github_token', encrypt(token, config.encryptionKey));
    res.set(NO_STORE_HEADERS).json({ saved: true, hasGitHubToken: true });
  } catch (err) {
    logger.errorFromError('auth.github-token', 'Failed to store GitHub token', err);
    res.status(500).json({ error: 'Failed to store GitHub token', code: 'GITHUB_TOKEN_SAVE_FAILED' });
  }
});

export default router;
