import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const proxyRequestMock = vi.fn();

vi.mock('../../src/db/connection.js', () => ({
  getDb: () => ({
    prepare: (sql: string) => ({
      get: (keyOrId: string) => {
        if (sql.includes('FROM webdav_configs')) {
          if (keyOrId === 'missing-id') return undefined;
          return {
            id: keyOrId,
            username: 'alice',
            password_encrypted: 'secret',
            url: 'https://dav.example.com',
          };
        }
        if (sql.includes('FROM settings')) {
          return undefined;
        }
        return undefined;
      },
    }),
  }),
}));

vi.mock('../../src/services/crypto.js', () => ({
  decrypt: (value: string) => value,
  encrypt: (value: string) => value,
}));

vi.mock('../../src/services/proxyService.js', () => ({
  validateUrl: vi.fn(),
  proxyRequest: proxyRequestMock,
}));

const { default: proxyRouter } = await import('../../src/routes/proxy.js');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(proxyRouter);
  return app;
};

describe('WebDAV proxy route', () => {
  beforeEach(() => {
    proxyRequestMock.mockReset();
    proxyRequestMock.mockResolvedValue({ status: 207, data: '<xml/>', headers: { 'content-type': 'application/xml' } });
  });

  it('returns raw XML/text for PROPFIND instead of JSON-wrapping', async () => {
    const app = createTestApp();

    const res = await request(app)
      .post('/api/proxy/webdav')
      .send({
        configId: 'webdav-1',
        method: 'PROPFIND',
        path: '/backup/',
        body: '<propfind/>',
        headers: { Depth: '1' },
      })
      .expect(207);

    expect(res.text).toBe('<xml/>');
    expect(res.headers['content-type']).toMatch(/xml/);
  });

  it('strips client Authorization headers case-insensitively before adding proxy auth', async () => {
    proxyRequestMock.mockResolvedValue({ status: 200, data: { ok: true }, headers: {} });
    const app = createTestApp();

    await request(app)
      .post('/api/proxy/webdav')
      .send({
        configId: 'webdav-1',
        method: 'PUT',
        path: '/backup.json',
        body: '{"ok":true}',
        headers: {
          authorization: 'Bearer lower-case-token',
          AuthorIzation: 'Bearer mixed-case-token',
          'Content-Type': 'application/json',
        },
      })
      .expect(200, { ok: true });

    expect(proxyRequestMock).toHaveBeenCalledOnce();
    const options = proxyRequestMock.mock.calls[0][0];
    expect(options.url).toBe('https://dav.example.com/backup.json');
    expect(options.headers.authorization).toBeUndefined();
    expect(options.headers.AuthorIzation).toBeUndefined();
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers.Authorization).toBe(`Basic ${Buffer.from('alice:secret').toString('base64')}`);
  });

  it('falls back to inline http:// config when configId is missing from SQLite', async () => {
    proxyRequestMock.mockResolvedValue({ status: 207, data: '<xml/>', headers: { 'content-type': 'application/xml' } });
    const app = createTestApp();

    const res = await request(app)
      .post('/api/proxy/webdav')
      .send({
        configId: 'missing-id',
        config: {
          url: 'http://192.168.1.10:5005',
          username: 'nas',
          password: 'pass',
        },
        method: 'PROPFIND',
        path: '/backup/',
        body: '<propfind/>',
        headers: { Depth: '1' },
      })
      .expect(207);

    expect(res.text).toBe('<xml/>');
    expect(proxyRequestMock).toHaveBeenCalledOnce();
    const options = proxyRequestMock.mock.calls[0][0];
    expect(options.url).toBe('http://192.168.1.10:5005/backup/');
    expect(options.allowPrivate).toBe(true);
    expect(options.headers.Authorization).toBe(`Basic ${Buffer.from('nas:pass').toString('base64')}`);
  });

  it('uses inline-only http WebDAV config without configId', async () => {
    proxyRequestMock.mockResolvedValue({ status: 201, data: 'created', headers: { 'content-type': 'text/plain' } });
    const app = createTestApp();

    await request(app)
      .post('/api/proxy/webdav')
      .send({
        config: {
          url: 'http://10.0.0.5/dav',
          username: 'u',
          password: 'p',
        },
        method: 'PUT',
        path: 'backup.json',
        body: '{}',
        responseType: 'text',
      })
      .expect(201);

    const options = proxyRequestMock.mock.calls[0][0];
    expect(options.url).toBe('http://10.0.0.5/dav/backup.json');
    expect(options.allowPrivate).toBe(true);
  });
});
