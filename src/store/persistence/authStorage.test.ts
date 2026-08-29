import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAuthMirror,
  readAuthMirror,
  writeAuthMirror,
  readSessionBackendSecret,
  writeSessionBackendSecret,
} from './authStorage';

describe('auth mirror storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists only non-sensitive user profile fields', () => {
    const user = {
      login: 'octocat',
      id: 1,
      avatar_url: 'https://github.com/octocat.png',
      name: 'Octocat',
      html_url: 'https://github.com/octocat',
      email: null,
    };

    writeAuthMirror({ user });
    const mirror = readAuthMirror();
    expect(mirror).toEqual({ user });

    const raw = JSON.parse(window.localStorage.getItem('github-stars-manager-auth') || '{}');
    expect(raw.githubToken).toBeUndefined();
    expect(raw.backendApiSecret).toBeUndefined();
  });

  it('clears mirror on logout cleanup', () => {
    writeAuthMirror({ user: null });
    clearAuthMirror();
    expect(readAuthMirror()).toBeNull();
  });
});

describe('session backend-secret storage (deprecated)', () => {
  it('no longer persists secrets in sessionStorage', () => {
    writeSessionBackendSecret('session-secret');
    expect(readSessionBackendSecret()).toBeNull();
    expect(window.sessionStorage.getItem('github-stars-manager-backend-secret')).toBeNull();
  });
});
