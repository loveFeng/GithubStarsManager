import { backend } from './backendAdapter';
import { useAppStore } from '../store/useAppStore';
import { logger } from './logger';
import { forceSyncToBackend } from './autoSync';

const IMPORT_FLAG_KEY = 'gsm:browser-data-imported-v1';

/**
 * One-shot upgrade path: after cookie session auth, push any rich local
 * IndexedDB/Zustand payload to SQLite, then clear sensitive local fields.
 * Safe to call repeatedly — runs at most once per browser profile.
 */
export async function importBrowserDataToBackendIfNeeded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!backend.isAvailable) return false;

  try {
    if (window.localStorage.getItem(IMPORT_FLAG_KEY) === '1') {
      return false;
    }
  } catch {
    return false;
  }

  const state = useAppStore.getState();
  const hasLocalPayload =
    state.repositories.length > 0
    || state.gists.length > 0
    || state.releases.length > 0
    || state.aiConfigs.length > 0
    || state.webdavConfigs.length > 0
    || state.customCategories.length > 0;

  if (!hasLocalPayload) {
    try {
      window.localStorage.setItem(IMPORT_FLAG_KEY, '1');
    } catch {
      /* ignore */
    }
    return false;
  }

  try {
    await forceSyncToBackend();

    // Drop long-lived secrets from the client store after a successful push.
    if (state.githubToken) {
      useAppStore.getState().setGitHubToken(null);
      useAppStore.getState().setGitHubAuthViaBackend(true);
    }
    if (state.backendApiSecret) {
      useAppStore.getState().setBackendApiSecret(null);
    }

    window.localStorage.setItem(IMPORT_FLAG_KEY, '1');
    logger.info('migrate.browserImport', 'Pushed browser IndexedDB payload to SQLite and cleared client secrets');
    return true;
  } catch (err) {
    logger.warn('migrate.browserImport', 'Browser → SQLite import failed; will retry later', {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
