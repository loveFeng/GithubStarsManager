import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { runMigrations } from '../../src/db/migrations.js';

describe('migration v2', () => {
  it('creates gists, fork_states, and repository chat tables', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    const version = db.prepare('SELECT MAX(version) as version FROM schema_version').get() as { version: number };
    expect(version.version).toBe(2);

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('gists', 'fork_states', 'repository_chat_sessions', 'repository_chat_messages') ORDER BY name"
    ).all() as Array<{ name: string }>;

    expect(tables.map((row) => row.name)).toEqual([
      'fork_states',
      'gists',
      'repository_chat_messages',
      'repository_chat_sessions',
    ]);
  });
});
