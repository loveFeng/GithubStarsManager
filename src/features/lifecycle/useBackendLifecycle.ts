import { useEffect, useState } from 'react';
import { backend } from '../../services/backendAdapter';
import { useAppStore } from '../../store/useAppStore';
import {
  startAutoSync,
  stopAutoSync,
  syncFromBackend,
  syncLocalGitHubTokenToBackend,
  tryRestoreAuthFromBackend,
} from '../../services/autoSync';
import { importBrowserDataToBackendIfNeeded } from '../../services/browserDataImport';

export type BackendLifecycleStatus = 'idle' | 'connecting' | 'ready' | 'unavailable';

/**
 * Clear stale client auth when the server session cookie is missing.
 * Keeps non-auth local data so users can still see cached repos after re-login.
 */
function clearStaleClientAuth(): void {
  const state = useAppStore.getState();
  if (!state.isAuthenticated && !state.user && !state.githubToken && !state.githubAuthViaBackend) {
    return;
  }
  useAppStore.setState({
    user: null,
    githubToken: null,
    githubAuthViaBackend: false,
    backendApiSecret: null,
    isAuthenticated: false,
  });
}

/**
 * Owns application-wide backend startup after Store hydration.
 * Pure Web deployments require the backend; local-only mode is no longer supported.
 */
export const useBackendLifecycle = (
  hasHydrated: boolean
): { status: BackendLifecycleStatus; retry: () => void } => {
  const [status, setStatus] = useState<BackendLifecycleStatus>('idle');
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const initialize = async () => {
      setStatus('connecting');
      try {
        await backend.init();
        if (cancelled) return;

        if (!backend.isAvailable) {
          setStatus('unavailable');
          return;
        }

        const session = await backend.getSession();
        if (cancelled) return;

        if (!session?.authenticated) {
          clearStaleClientAuth();
          setStatus('ready');
          return;
        }

        await tryRestoreAuthFromBackend();
        if (cancelled) return;

        // If restore failed but cookie exists without GitHub token, stay on login step 2.
        const afterRestore = useAppStore.getState();
        if (!afterRestore.isAuthenticated && !session.hasGitHubToken) {
          clearStaleClientAuth();
          setStatus('ready');
          return;
        }

        await syncLocalGitHubTokenToBackend();
        if (cancelled) return;

        await syncFromBackend();
        if (cancelled) return;

        await importBrowserDataToBackendIfNeeded();
        if (cancelled) return;

        unsubscribe = startAutoSync();
        setStatus('ready');
      } catch (error) {
        console.error('Failed to initialize backend:', error);
        if (!cancelled) {
          setStatus('unavailable');
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      if (unsubscribe) {
        stopAutoSync(unsubscribe);
      }
    };
  }, [hasHydrated, retryToken]);

  return {
    status,
    retry: () => setRetryToken((value) => value + 1),
  };
};
