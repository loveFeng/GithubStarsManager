
import { defaultReleaseSourceSettings } from '../../types';
import { logger } from '../../services/logger';
import type { AppStoreSlice } from '../types';
import { clearAuthMirror, writeAuthMirror, writeSessionBackendSecret } from '../persistence/authStorage';
import { backend } from '../../services/backendAdapter';

export const createAuthSlice: AppStoreSlice<Pick<import('../types').AppActions, 'setUser' | 'setGitHubToken' | 'setBackendApiSecret' | 'setGitHubAuthViaBackend' | 'logout'>> = (set, get) => ({
      // Auth actions
      setUser: (user) => {
        logger.info('store.setUser', 'Setting user', { hasUser: !!user });
        set({ user, isAuthenticated: !!user });
        writeAuthMirror({ user });
      },
      setGitHubToken: (token) => {
        logger.info('store.setGitHubToken', 'Setting GitHub token', { hasToken: !!token });
        set({
          githubToken: token,
          ...(token ? { githubAuthViaBackend: false } : {}),
        });
        const { user } = get();
        writeAuthMirror({ user });
      },
      setBackendApiSecret: (backendApiSecret) => {
        writeSessionBackendSecret(backendApiSecret);
        set({ backendApiSecret });
      },
      setGitHubAuthViaBackend: (githubAuthViaBackend) => {
        set({ githubAuthViaBackend });
      },
      logout: () => {
        clearAuthMirror();
        writeSessionBackendSecret(null);
        void backend.logout();
        set({
          user: null,
          githubToken: null,
          githubAuthViaBackend: false,
          backendApiSecret: null,
          isAuthenticated: false,
          repositories: [],
          gists: [],
          starredGists: [],
          gistSearchResults: [],
          analyzingGistIds: new Set(),
          releases: [],
          releaseSubscriptions: new Set(),
          releaseSourceSettings: defaultReleaseSourceSettings,
          readReleases: new Set(),
          forks: [],
          readForks: new Set(),
          analyzingRepositoryIds: new Set(),
          searchResults: [],
          similarView: null,
          lastSync: null,
        });
      },

});
