import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDbMock = vi.fn();

vi.mock('../../src/db/connection.js', () => ({
  getDb: () => getDbMock(),
}));

vi.mock('../../src/services/crypto.js', () => ({
  encrypt: (value: string) => `enc:${value}`,
  decrypt: (value: string) => value.replace(/^enc:/, ''),
}));

describe('auth routes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('API_SECRET', 'super-secret');
    getDbMock.mockReturnValue({
      prepare: () => ({
        get: () => undefined,
        run: vi.fn(),
      }),
    });
  });

  it('POST /api/auth/login sets session cookie on valid secret', async () => {
    const { default: authRouter } = await import('../../src/routes/auth.js');
    const { clearAllSessionsForTests } = await import('../../src/services/session.js');
    clearAllSessionsForTests();

    const app = express();
    app.use(express.json());
    app.use(authRouter);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ secret: 'super-secret' })
      .expect(200);

    expect(res.body).toEqual({ authenticated: true });
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toContain('gsm_session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('POST /api/auth/login rejects invalid secret', async () => {
    const { default: authRouter } = await import('../../src/routes/auth.js');
    const app = express();
    app.use(express.json());
    app.use(authRouter);

    await request(app)
      .post('/api/auth/login')
      .send({ secret: 'wrong' })
      .expect(401);
  });

  it('GET /api/auth/session reports cookie session and GitHub token presence', async () => {
    const { default: authRouter } = await import('../../src/routes/auth.js');
    const { clearAllSessionsForTests } = await import('../../src/services/session.js');
    clearAllSessionsForTests();

    getDbMock.mockReturnValue({
      prepare: () => ({
        get: (key: string) => (key === 'github_token' ? { value: 'enc:ghp_test' } : undefined),
        run: vi.fn(),
      }),
    });

    const app = express();
    app.use(express.json());
    app.use(authRouter);

    const login = await request(app).post('/api/auth/login').send({ secret: 'super-secret' });
    const cookie = login.headers['set-cookie'];

    const res = await request(app)
      .get('/api/auth/session')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body).toEqual({ authenticated: true, hasGitHubToken: true });
  });

  it('POST /api/auth/logout clears the session cookie', async () => {
    const { default: authRouter } = await import('../../src/routes/auth.js');
    const app = express();
    app.use(express.json());
    app.use(authRouter);

    const login = await request(app).post('/api/auth/login').send({ secret: 'super-secret' });
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    expect(res.body).toEqual({ authenticated: false });
    expect(res.headers['set-cookie']?.[0]).toContain('Max-Age=0');
  });
});

describe('auth middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('API_SECRET', 'super-secret');
  });

  it('allows Bearer API_SECRET', async () => {
    const { authMiddleware } = await import('../../src/middleware/auth.js');
    const app = express();
    app.use('/api', authMiddleware);
    app.get('/api/private', (_req, res) => res.json({ ok: true }));

    await request(app)
      .get('/api/private')
      .set('Authorization', 'Bearer super-secret')
      .expect(200, { ok: true });
  });

  it('allows valid session cookie', async () => {
    const { authMiddleware } = await import('../../src/middleware/auth.js');
    const { clearAllSessionsForTests, createSession } = await import('../../src/services/session.js');
    clearAllSessionsForTests();
    const session = createSession();

    const app = express();
    app.use('/api', authMiddleware);
    app.get('/api/private', (_req, res) => res.json({ ok: true }));

    await request(app)
      .get('/api/private')
      .set('Cookie', `gsm_session=${encodeURIComponent(session)}`)
      .expect(200, { ok: true });
  });

  it('rejects unauthenticated requests', async () => {
    const { authMiddleware } = await import('../../src/middleware/auth.js');
    const app = express();
    app.use('/api', authMiddleware);
    app.get('/api/private', (_req, res) => res.json({ ok: true }));

    await request(app).get('/api/private').expect(401);
  });
});

describe('authRestore route (POST /api/sync/auth)', () => {
  beforeEach(() => {
    getDbMock.mockReset();
  });

  it('returns hasGitHubToken without exposing PAT', async () => {
    getDbMock.mockReturnValue({
      prepare: () => ({
        get: (key: string) => (key === 'github_token' ? { value: 'enc:ghp_secret' } : undefined),
      }),
    });

    const { default: authRestoreRouter } = await import('../../src/routes/authRestore.js');
    const app = express();
    app.use(express.json());
    app.use(authRestoreRouter);

    const res = await request(app).post('/api/sync/auth').expect(200);
    expect(res.body).toEqual({ hasGitHubToken: true });
    expect(res.body.github_token).toBeUndefined();
  });
});

describe('config production guard', () => {
  it('throws when API_SECRET missing in production', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('API_SECRET', '');
    vi.stubEnv('ENCRYPTION_KEY', '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');

    await expect(import('../../src/config.js')).rejects.toThrow(/API_SECRET is required/);
  });
});
