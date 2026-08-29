import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  clearAllSessionsForTests,
  SESSION_COOKIE_NAME,
} from '../../src/services/session.js';

describe('session service', () => {
  beforeEach(() => {
    clearAllSessionsForTests();
    vi.stubEnv('API_SECRET', 'test-secret-key');
    vi.resetModules();
  });

  afterEach(() => {
    clearAllSessionsForTests();
    vi.unstubAllEnvs();
  });

  it('creates and validates a signed session token', async () => {
    const { createSession, validateSession } = await import('../../src/services/session.js');
    const session = createSession();
    expect(session.includes('.')).toBe(true);
    expect(validateSession(session)).toBe(true);
    expect(validateSession('tampered.token')).toBe(false);
  });

  it('rejects expired sessions', async () => {
    vi.useFakeTimers();
    const { createSession, validateSession } = await import('../../src/services/session.js');
    const session = createSession();
    vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
    expect(validateSession(session)).toBe(false);
    vi.useRealTimers();
  });
});

describe('SESSION_COOKIE_NAME', () => {
  it('uses gsm_session cookie name', () => {
    expect(SESSION_COOKIE_NAME).toBe('gsm_session');
  });
});
