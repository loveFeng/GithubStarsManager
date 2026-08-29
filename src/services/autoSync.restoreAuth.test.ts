import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tryRestoreAuthFromBackend } from './autoSync';
import { backend } from './backendAdapter';
import { useAppStore } from '../store/useAppStore';

vi.mock('./backendAdapter', () => ({
  backend: {
    isAvailable: true,
    getSession: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('../store/useAppStore', () => ({
  useAppStore: {
    getState: vi.fn(),
  },
}));

type MockBackend = {
  isAvailable: boolean;
  getSession: ReturnType<typeof vi.fn>;
  getCurrentUser: ReturnType<typeof vi.fn>;
};

type MockStore = {
  getState: ReturnType<typeof vi.fn>;
};

const mockBackend = backend as unknown as MockBackend;
const mockStore = useAppStore as unknown as MockStore;

describe('tryRestoreAuthFromBackend', () => {
  const setGitHubAuthViaBackend = vi.fn();
  const setUser = vi.fn();
  const user = { id: 1, login: 'alice', name: 'Alice', avatar_url: '', email: null };

  beforeEach(() => {
    mockBackend.isAvailable = true;
    mockBackend.getSession.mockReset();
    mockBackend.getCurrentUser.mockReset();
    setGitHubAuthViaBackend.mockReset();
    setUser.mockReset();
    mockStore.getState.mockReset();
  });

  it('sets githubAuthViaBackend when hydrated user exists without local PAT', async () => {
    mockStore.getState.mockReturnValue({
      user,
      githubToken: null,
      githubAuthViaBackend: false,
      setGitHubAuthViaBackend,
      setUser,
    });
    mockBackend.getSession.mockResolvedValue({ authenticated: true, hasGitHubToken: true });
    mockBackend.getCurrentUser.mockResolvedValue(user);

    await expect(tryRestoreAuthFromBackend()).resolves.toBe(true);

    expect(setGitHubAuthViaBackend).toHaveBeenCalledWith(true);
    expect(setUser).toHaveBeenCalledWith(user);
  });

  it('skips when backend auth is already ready', async () => {
    mockStore.getState.mockReturnValue({
      user,
      githubToken: null,
      githubAuthViaBackend: true,
      setGitHubAuthViaBackend,
      setUser,
    });

    await expect(tryRestoreAuthFromBackend()).resolves.toBe(false);
    expect(mockBackend.getSession).not.toHaveBeenCalled();
  });

  it('skips when session has no GitHub token', async () => {
    mockStore.getState.mockReturnValue({
      user: null,
      githubToken: null,
      githubAuthViaBackend: false,
      setGitHubAuthViaBackend,
      setUser,
    });
    mockBackend.getSession.mockResolvedValue({ authenticated: true, hasGitHubToken: false });

    await expect(tryRestoreAuthFromBackend()).resolves.toBe(false);
    expect(setGitHubAuthViaBackend).not.toHaveBeenCalled();
  });
});
