import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const getDbMock = vi.fn();

vi.mock('../../src/db/connection.js', () => ({
  getDb: () => getDbMock(),
}));

const { default: authRestoreRouter } = await import('../../src/routes/authRestore.js');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(authRestoreRouter);
  return app;
};

describe('authRestore route (POST /api/sync/auth)', () => {
  it('returns hasGitHubToken without exposing PAT', async () => {
    getDbMock.mockReturnValue({
      prepare: () => ({
        get: (key: string) => (key === 'github_token' ? { value: 'encrypted-token' } : undefined),
      }),
    });

    const res = await request(createTestApp()).post('/api/sync/auth').expect(200);
    expect(res.body).toEqual({ hasGitHubToken: true });
    expect(res.body.github_token).toBeUndefined();
  });

  it('returns hasGitHubToken false when none is stored', async () => {
    getDbMock.mockReturnValue({
      prepare: () => ({
        get: () => undefined,
      }),
    });

    const res = await request(createTestApp()).post('/api/sync/auth').expect(200);
    expect(res.body).toEqual({ hasGitHubToken: false });
  });
});
