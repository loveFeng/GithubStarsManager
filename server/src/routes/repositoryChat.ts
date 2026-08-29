import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';

const router = Router();

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function transformSession(row: Record<string, unknown>) {
  return {
    id: row.id,
    repoId: row.repo_id,
    repoFullName: row.repo_full_name,
    sourceRefSha: row.source_ref_sha ?? '',
    title: row.title,
    summary: row.summary ?? undefined,
    modelConfigId: row.model_config_id ?? null,
    modelLabelAtTime: row.model_label_at_time ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

function transformMessage(row: Record<string, unknown>) {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    status: row.status,
    evidenceIds: parseJsonArray(row.evidence_ids_json),
    createdAt: row.created_at,
  };
}

// GET /api/repository-chat/sessions
router.get('/api/repository-chat/sessions', (req, res) => {
  try {
    const db = getDb();
    const repoId = req.query.repo_id ? parseInt(req.query.repo_id as string) : undefined;
    let rows: Record<string, unknown>[];
    if (repoId) {
      rows = db.prepare(
        'SELECT * FROM repository_chat_sessions WHERE repo_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC'
      ).all(repoId) as Record<string, unknown>[];
    } else {
      rows = db.prepare(
        'SELECT * FROM repository_chat_sessions WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 500'
      ).all() as Record<string, unknown>[];
    }
    res.json({ sessions: rows.map(transformSession), total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch chat sessions' });
  }
});

// GET /api/repository-chat/sessions/:id
router.get('/api/repository-chat/sessions/:id', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM repository_chat_sessions WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const messages = db.prepare(
      'SELECT * FROM repository_chat_messages WHERE session_id = ? ORDER BY created_at ASC'
    ).all(req.params.id) as Record<string, unknown>[];
    res.json({ session: transformSession(row), messages: messages.map(transformMessage) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch chat session' });
  }
});

// POST /api/repository-chat/sessions
router.post('/api/repository-chat/sessions', (req, res) => {
  try {
    const db = getDb();
    const body = req.body ?? {};
    const id = typeof body.id === 'string' ? body.id : crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO repository_chat_sessions (
        id, repo_id, repo_full_name, source_ref_sha, title, summary,
        model_config_id, model_label_at_time, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `).run(
      id,
      body.repoId ?? body.repo_id,
      body.repoFullName ?? body.repo_full_name ?? '',
      body.sourceRefSha ?? body.source_ref_sha ?? '',
      body.title ?? 'Untitled',
      body.summary ?? null,
      body.modelConfigId ?? body.model_config_id ?? null,
      body.modelLabelAtTime ?? body.model_label_at_time ?? null,
      body.createdAt ?? body.created_at ?? now,
      body.updatedAt ?? body.updated_at ?? now,
    );
    const row = db.prepare('SELECT * FROM repository_chat_sessions WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json({ session: transformSession(row) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create chat session' });
  }
});

// PUT /api/repository-chat/sessions/:id
router.put('/api/repository-chat/sessions/:id', (req, res) => {
  try {
    const db = getDb();
    const body = req.body ?? {};
    const existing = db.prepare('SELECT * FROM repository_chat_sessions WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE repository_chat_sessions SET
        title = COALESCE(?, title),
        summary = COALESCE(?, summary),
        source_ref_sha = COALESCE(?, source_ref_sha),
        model_config_id = COALESCE(?, model_config_id),
        model_label_at_time = COALESCE(?, model_label_at_time),
        updated_at = ?,
        deleted_at = COALESCE(?, deleted_at)
      WHERE id = ?
    `).run(
      body.title ?? null,
      body.summary ?? null,
      body.sourceRefSha ?? body.source_ref_sha ?? null,
      body.modelConfigId ?? body.model_config_id ?? null,
      body.modelLabelAtTime ?? body.model_label_at_time ?? null,
      body.updatedAt ?? body.updated_at ?? now,
      body.deletedAt ?? body.deleted_at ?? null,
      req.params.id,
    );
    const row = db.prepare('SELECT * FROM repository_chat_sessions WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    res.json({ session: transformSession(row) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update chat session' });
  }
});

// DELETE /api/repository-chat/sessions/:id — soft delete
router.delete('/api/repository-chat/sessions/:id', (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db.prepare(
      'UPDATE repository_chat_sessions SET deleted_at = ?, updated_at = ? WHERE id = ?'
    ).run(now, now, req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete chat session' });
  }
});

// POST /api/repository-chat/sessions/:id/messages — append message
router.post('/api/repository-chat/sessions/:id/messages', (req, res) => {
  try {
    const db = getDb();
    const session = db.prepare('SELECT id FROM repository_chat_sessions WHERE id = ?').get(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const body = req.body ?? {};
    const id = typeof body.id === 'string' ? body.id : crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO repository_chat_messages (id, session_id, role, content, status, evidence_ids_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.params.id,
      body.role ?? 'user',
      body.content ?? '',
      body.status ?? 'complete',
      JSON.stringify(Array.isArray(body.evidenceIds) ? body.evidenceIds : []),
      body.createdAt ?? body.created_at ?? now,
    );
    db.prepare('UPDATE repository_chat_sessions SET updated_at = ? WHERE id = ?').run(now, req.params.id);
    const row = db.prepare('SELECT * FROM repository_chat_messages WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json({ message: transformMessage(row) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to append chat message' });
  }
});

export default router;
