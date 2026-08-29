import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const getDbMock = vi.fn();

vi.mock('../../src/db/connection.js', () => ({
  getDb: () => getDbMock(),
}));

const { default: gistsRouter } = await import('../../src/routes/gists.js');
const { default: forkStatesRouter } = await import('../../src/routes/forkStates.js');

function captureDb() {
  const statements: Array<{ sql: string; params: unknown[] }> = [];
  const db = {
    prepare: (sql: string) => ({
      run: (...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1 };
      },
      all: () => [],
      get: () => undefined,
    }),
    transaction: (fn: (items: unknown[]) => number) => fn,
  };
  getDbMock.mockReturnValue(db);
  return { statements, db };
}

describe('v2 domain routes', () => {
  it('PUT /api/gists accepts bulk upsert payload', async () => {
    captureDb();
    const app = express();
    app.use(express.json());
    app.use(gistsRouter);

    const res = await request(app)
      .put('/api/gists')
      .send({
        gists: [{
          id: 'abc',
          html_url: 'https://gist.github.com/abc',
          public: true,
          files: {},
        }],
      })
      .expect(200);

    expect(res.body.upserted).toBe(1);
  });

  it('PUT /api/fork-states accepts bulk upsert payload', async () => {
    captureDb();
    const app = express();
    app.use(express.json());
    app.use(forkStatesRouter);

    const res = await request(app)
      .put('/api/fork-states')
      .send({
        states: [{
          repo_id: 42,
          full_name: 'user/repo',
          is_read: true,
        }],
      })
      .expect(200);

    expect(res.body.upserted).toBe(1);
  });
});
