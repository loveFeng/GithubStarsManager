import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function transformForkState(row: Record<string, unknown>) {
  return {
    repo_id: row.repo_id,
    full_name: row.full_name,
    is_read: !!row.is_read,
    last_checked_at: row.last_checked_at ?? null,
    upstream_full_name: row.upstream_full_name ?? null,
    upstream_updated_at: row.upstream_updated_at ?? null,
    synced_at: row.synced_at ?? null,
  };
}

// GET /api/fork-states
router.get('/api/fork-states', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM fork_states ORDER BY repo_id').all() as Record<string, unknown>[];
    res.json({ states: rows.map(transformForkState), total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch fork states' });
  }
});

// PUT /api/fork-states — bulk upsert
router.put('/api/fork-states', (req, res) => {
  try {
    const db = getDb();
    const states = Array.isArray(req.body?.states) ? req.body.states : [];
    const upsert = db.prepare(`
      INSERT INTO fork_states (
        repo_id, full_name, is_read, last_checked_at, upstream_full_name, upstream_updated_at, synced_at
      ) VALUES (
        @repo_id, @full_name, @is_read, @last_checked_at, @upstream_full_name, @upstream_updated_at, @synced_at
      )
      ON CONFLICT(repo_id) DO UPDATE SET
        full_name = excluded.full_name,
        is_read = excluded.is_read,
        last_checked_at = excluded.last_checked_at,
        upstream_full_name = excluded.upstream_full_name,
        upstream_updated_at = excluded.upstream_updated_at,
        synced_at = excluded.synced_at
    `);

    const tx = db.transaction((items: unknown[]) => {
      let upserted = 0;
      for (const raw of items) {
        const s = raw as Record<string, unknown>;
        if (typeof s.repo_id !== 'number' || typeof s.full_name !== 'string') continue;
        upsert.run({
          repo_id: s.repo_id,
          full_name: s.full_name,
          is_read: s.is_read ? 1 : 0,
          last_checked_at: s.last_checked_at ?? null,
          upstream_full_name: s.upstream_full_name ?? null,
          upstream_updated_at: s.upstream_updated_at ?? null,
          synced_at: s.synced_at ?? new Date().toISOString(),
        });
        upserted += 1;
      }
      return upserted;
    });

    const upserted = tx(states);
    res.json({ upserted });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to upsert fork states' });
  }
});

export default router;
