import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function parseJsonColumn(value: unknown): unknown {
  if (typeof value !== 'string' || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseJsonArray(value: unknown): unknown[] {
  const parsed = parseJsonColumn(value);
  return Array.isArray(parsed) ? parsed : [];
}

function transformGist(row: Record<string, unknown>) {
  return {
    id: row.id,
    description: row.description ?? null,
    html_url: row.html_url,
    public: !!row.public,
    created_at: row.created_at,
    updated_at: row.updated_at,
    comments: row.comments ?? 0,
    owner: row.owner_login
      ? { login: row.owner_login, avatar_url: row.owner_avatar_url ?? '' }
      : null,
    files: parseJsonColumn(row.files_json) ?? {},
    starred: !!row.starred,
    is_owner: !!row.is_owner,
    ai_summary: row.ai_summary ?? undefined,
    ai_tags: parseJsonArray(row.ai_tags),
    analyzed_at: row.analyzed_at ?? undefined,
    analysis_failed: !!row.analysis_failed,
    analysis_error: row.analysis_error ?? undefined,
    last_edited: row.last_edited ?? undefined,
  };
}

// GET /api/gists
router.get('/api/gists', (req, res) => {
  try {
    const db = getDb();
    const limit = Math.min(10000, Math.max(1, parseInt(req.query.limit as string) || 1000));
    const rows = db.prepare('SELECT * FROM gists ORDER BY updated_at DESC LIMIT ?').all(limit) as Record<string, unknown>[];
    res.json({ gists: rows.map(transformGist), total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch gists' });
  }
});

// PUT /api/gists — bulk upsert
router.put('/api/gists', (req, res) => {
  try {
    const db = getDb();
    const gists = Array.isArray(req.body?.gists) ? req.body.gists : [];
    const upsert = db.prepare(`
      INSERT INTO gists (
        id, description, html_url, public, created_at, updated_at, owner_login, owner_avatar_url,
        files_json, ai_summary, ai_tags, starred, is_owner, analyzed_at, analysis_failed,
        analysis_error, last_edited, comments
      ) VALUES (
        @id, @description, @html_url, @public, @created_at, @updated_at, @owner_login, @owner_avatar_url,
        @files_json, @ai_summary, @ai_tags, @starred, @is_owner, @analyzed_at, @analysis_failed,
        @analysis_error, @last_edited, @comments
      )
      ON CONFLICT(id) DO UPDATE SET
        description = excluded.description,
        html_url = excluded.html_url,
        public = excluded.public,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        owner_login = excluded.owner_login,
        owner_avatar_url = excluded.owner_avatar_url,
        files_json = excluded.files_json,
        ai_summary = excluded.ai_summary,
        ai_tags = excluded.ai_tags,
        starred = excluded.starred,
        is_owner = excluded.is_owner,
        analyzed_at = excluded.analyzed_at,
        analysis_failed = excluded.analysis_failed,
        analysis_error = excluded.analysis_error,
        last_edited = excluded.last_edited,
        comments = excluded.comments
    `);

    const tx = db.transaction((items: unknown[]) => {
      let upserted = 0;
      for (const raw of items) {
        const g = raw as Record<string, unknown>;
        if (typeof g.id !== 'string' || typeof g.html_url !== 'string') continue;
        const owner = (g.owner ?? {}) as Record<string, unknown>;
        upsert.run({
          id: g.id,
          description: g.description ?? null,
          html_url: g.html_url,
          public: g.public ? 1 : 0,
          created_at: g.created_at ?? null,
          updated_at: g.updated_at ?? null,
          owner_login: typeof owner.login === 'string' ? owner.login : null,
          owner_avatar_url: typeof owner.avatar_url === 'string' ? owner.avatar_url : null,
          files_json: JSON.stringify(g.files ?? {}),
          ai_summary: g.ai_summary ?? null,
          ai_tags: JSON.stringify(Array.isArray(g.ai_tags) ? g.ai_tags : []),
          starred: g.starred ? 1 : 0,
          is_owner: g.is_owner ? 1 : 0,
          analyzed_at: g.analyzed_at ?? null,
          analysis_failed: g.analysis_failed ? 1 : 0,
          analysis_error: g.analysis_error ?? null,
          last_edited: g.last_edited ?? null,
          comments: typeof g.comments === 'number' ? g.comments : 0,
        });
        upserted += 1;
      }
      return upserted;
    });

    const upserted = tx(gists);
    res.json({ upserted });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to upsert gists' });
  }
});

export default router;
