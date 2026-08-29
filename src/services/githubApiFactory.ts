import { useAppStore } from '../store/useAppStore';
import { backend } from './backendAdapter';
import { GitHubApiService } from './githubApi';
import { GitHubListsApiService } from './githubListsApi';

type GitHubAccessState = {
  githubToken: string | null;
  githubAuthViaBackend: boolean;
  user: unknown;
};

/**
 * Whether the UI has GitHub access (local PAT or backend-held PAT).
 * Prefer this over checking `githubToken` alone — web mode keeps the PAT on the server.
 */
export function hasGitHubAccess(state?: GitHubAccessState): boolean {
  const s = state ?? useAppStore.getState();
  if (s.githubToken) return true;
  return !!(s.githubAuthViaBackend && s.user);
}

/** Whether GitHub API calls can proceed (local PAT or backend-stored token + live backend). */
export function isGitHubApiReady(): boolean {
  return hasGitHubAccess() && (!!useAppStore.getState().githubToken || backend.isAvailable);
}

export function createGitHubApiService(token?: string | null): GitHubApiService {
  const state = useAppStore.getState();
  const effectiveToken = token ?? state.githubToken ?? '';

  if (!effectiveToken && !isGitHubApiReady()) {
    throw new Error('GitHub API not available — sign in first');
  }

  const api = new GitHubApiService(effectiveToken || 'backend-proxy');

  if (backend.backendUrl) {
    api.setBackendUrl(backend.backendUrl);
    api.setBackendAuthToken(state.backendApiSecret || null);
  } else if (!effectiveToken) {
    throw new Error('GitHub token required without backend');
  }

  return api;
}

export function createGitHubListsApiService(token?: string | null): GitHubListsApiService {
  const state = useAppStore.getState();
  const effectiveToken = token ?? state.githubToken ?? '';

  if (!effectiveToken && !isGitHubApiReady()) {
    throw new Error('GitHub API not available — sign in first');
  }

  const api = new GitHubListsApiService(effectiveToken || 'backend-proxy');

  if (backend.backendUrl) {
    api.setBackendUrl(backend.backendUrl);
    api.setBackendAuthToken(state.backendApiSecret || null);
  } else if (!effectiveToken) {
    throw new Error('GitHub token required without backend');
  }

  return api;
}
