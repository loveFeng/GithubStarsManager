import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGitHubApiService, hasGitHubAccess, isGitHubApiReady } from './githubApiFactory';
import { backend } from './backendAdapter';
import { useAppStore } from '../store/useAppStore';

const setBackendUrl = vi.fn();
const setBackendAuthToken = vi.fn();

vi.mock('./backendAdapter', () => ({
  backend: {
    isAvailable: true,
    backendUrl: '/api',
  },
}));

vi.mock('../store/useAppStore', () => ({
  useAppStore: {
    getState: vi.fn(),
  },
}));

vi.mock('./githubApi', () => ({
  GitHubApiService: vi.fn(function MockGitHubApiService() {
    return { setBackendUrl, setBackendAuthToken };
  }),
}));

type MockStore = { getState: ReturnType<typeof vi.fn> };
const mockStore = useAppStore as unknown as MockStore;
const mockBackend = backend as { isAvailable: boolean; backendUrl: string };

describe('githubApiFactory web auth', () => {
  beforeEach(() => {
    mockBackend.isAvailable = true;
    mockBackend.backendUrl = '/api';
    mockStore.getState.mockReset();
    setBackendUrl.mockReset();
    setBackendAuthToken.mockReset();
  });

  it('hasGitHubAccess accepts backend-held PAT without local token', () => {
    expect(hasGitHubAccess({
      githubToken: null,
      githubAuthViaBackend: true,
      user: { login: 'alice' },
    })).toBe(true);
    expect(hasGitHubAccess({
      githubToken: null,
      githubAuthViaBackend: false,
      user: { login: 'alice' },
    })).toBe(false);
  });

  it('isGitHubApiReady when githubAuthViaBackend and backend available', () => {
    mockStore.getState.mockReturnValue({
      githubToken: null,
      githubAuthViaBackend: true,
      user: { login: 'alice' },
      backendApiSecret: null,
    });
    expect(isGitHubApiReady()).toBe(true);
  });

  it('createGitHubApiService uses backend proxy without local PAT', () => {
    mockStore.getState.mockReturnValue({
      githubToken: null,
      githubAuthViaBackend: true,
      user: { login: 'alice' },
      backendApiSecret: null,
    });
    const api = createGitHubApiService();
    expect(api).toBeTruthy();
    expect(setBackendUrl).toHaveBeenCalledWith('/api');
  });
});
