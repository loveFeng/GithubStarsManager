import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const calls: string[] = [];
  const unsubscribe = vi.fn(() => calls.push('unsubscribe'));
  return {
    calls,
    unsubscribe,
    backend: {
      init: vi.fn(async () => { calls.push('backend.init'); }),
      isAvailable: true,
      getSession: vi.fn(async () => {
        calls.push('get-session');
        return { authenticated: true, hasGitHubToken: true };
      }),
    },
    tryRestoreAuthFromBackend: vi.fn(async () => { calls.push('restore-auth'); return true; }),
    syncLocalGitHubTokenToBackend: vi.fn(async () => { calls.push('sync-local-token'); }),
    syncFromBackend: vi.fn(async () => { calls.push('sync-from-backend'); }),
    startAutoSync: vi.fn(() => { calls.push('start-auto-sync'); return unsubscribe; }),
    stopAutoSync: vi.fn(() => { calls.push('stop-auto-sync'); }),
    storeState: {
      isAuthenticated: false,
      user: null,
      githubToken: null,
      githubAuthViaBackend: false,
    },
    setState: vi.fn((partial: Record<string, unknown>) => {
      Object.assign(mocks.storeState, partial);
    }),
  };
});

vi.mock('../../services/backendAdapter', () => ({ backend: mocks.backend }));
vi.mock('../../services/autoSync', () => ({
  tryRestoreAuthFromBackend: mocks.tryRestoreAuthFromBackend,
  syncLocalGitHubTokenToBackend: mocks.syncLocalGitHubTokenToBackend,
  syncFromBackend: mocks.syncFromBackend,
  startAutoSync: mocks.startAutoSync,
  stopAutoSync: mocks.stopAutoSync,
}));
vi.mock('../../services/browserDataImport', () => ({
  importBrowserDataToBackendIfNeeded: vi.fn(async () => {
    mocks.calls.push('browser-import');
    return false;
  }),
}));
vi.mock('../../store/useAppStore', () => ({
  useAppStore: Object.assign(
    (selector?: (state: typeof mocks.storeState) => unknown) =>
      (selector ? selector(mocks.storeState) : mocks.storeState),
    {
      getState: () => mocks.storeState,
      setState: mocks.setState,
    },
  ),
}));

import { useBackendLifecycle } from './useBackendLifecycle';

describe('useBackendLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.calls.splice(0);
    mocks.backend.isAvailable = true;
    mocks.backend.init.mockImplementation(async () => { mocks.calls.push('backend.init'); });
    mocks.backend.getSession.mockImplementation(async () => {
      mocks.calls.push('get-session');
      return { authenticated: true, hasGitHubToken: true };
    });
    Object.assign(mocks.storeState, {
      isAuthenticated: false,
      user: null,
      githubToken: null,
      githubAuthViaBackend: false,
    });
  });

  it('waits for hydration and restores authentication before backend data synchronization', async () => {
    const { rerender, result } = renderHook(({ hasHydrated }) => useBackendLifecycle(hasHydrated), {
      initialProps: { hasHydrated: false },
    });

    expect(mocks.backend.init).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');

    rerender({ hasHydrated: true });
    await waitFor(() => expect(mocks.startAutoSync).toHaveBeenCalledOnce());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(mocks.calls).toEqual([
      'backend.init',
      'get-session',
      'restore-auth',
      'sync-local-token',
      'sync-from-backend',
      'browser-import',
      'start-auto-sync',
    ]);
  });

  it('clears stale client auth and skips sync when session cookie is missing', async () => {
    mocks.backend.getSession.mockResolvedValueOnce({ authenticated: false, hasGitHubToken: false });
    Object.assign(mocks.storeState, {
      isAuthenticated: true,
      user: { login: 'old' },
      githubAuthViaBackend: true,
    });

    const { result } = renderHook(() => useBackendLifecycle(true));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(mocks.setState).toHaveBeenCalledWith(expect.objectContaining({ isAuthenticated: false }));
    expect(mocks.syncFromBackend).not.toHaveBeenCalled();
    expect(mocks.startAutoSync).not.toHaveBeenCalled();
  });

  it('reports unavailable when backend probing fails', async () => {
    mocks.backend.init.mockRejectedValueOnce(new Error('backend unavailable'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { result } = renderHook(() => useBackendLifecycle(true));
    await waitFor(() => expect(result.current.status).toBe('unavailable'));

    expect(mocks.tryRestoreAuthFromBackend).not.toHaveBeenCalled();
    expect(mocks.syncFromBackend).not.toHaveBeenCalled();
    expect(mocks.startAutoSync).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('reports unavailable when backend health probe finds no server', async () => {
    mocks.backend.isAvailable = false;
    const { result } = renderHook(() => useBackendLifecycle(true));
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    expect(mocks.startAutoSync).not.toHaveBeenCalled();
  });

  it('stops auto-sync on unmount', async () => {
    const { unmount } = renderHook(() => useBackendLifecycle(true));
    await waitFor(() => expect(mocks.startAutoSync).toHaveBeenCalledOnce());

    unmount();

    expect(mocks.stopAutoSync).toHaveBeenCalledWith(mocks.unsubscribe);
  });
});
