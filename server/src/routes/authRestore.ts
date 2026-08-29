import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { logger } from '../services/logger.js';

const router = Router();

/**
 * POST /api/sync/auth
 *
 * Session recovery hint — never returns the GitHub PAT. Clients with a valid
 * session or Bearer API_SECRET learn whether the backend holds a GitHub token
 * and should use the GitHub proxy routes instead of restoring a local PAT.
 */
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

function hasStoredGitHubToken(): boolean {
  const db = getDb();
  const tokenRow = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('github_token') as { value: string } | undefined;
  return !!tokenRow?.value;
}

router.post('/api/sync/auth', (_req, res) => {
  try {
    res.set(NO_STORE_HEADERS).json({ hasGitHubToken: hasStoredGitHubToken() });
  } catch (err) {
    logger.errorFromError('authRestore', 'POST /api/sync/auth error', err);
    res.status(500).json({ error: 'Failed to restore auth', code: 'AUTH_RESTORE_FAILED' });
  }
});

export default router;
