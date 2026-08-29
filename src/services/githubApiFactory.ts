import { useAppStore } from '../store/useAppStore';
import { backend } from './backendAdapter';
import { GitHubApiService } from './githubApi';
import { GitHubListsApiService } from './githubListsApi';

/** Whether GitHub API calls can proceed (local PAT or backend-stored token). */
export function isGitHubApiReady(): boolean {
  const state = useAppStore.getState();
  if (state.githubToken) return true;
  return !!(state.githubAuthViaBackend && state.user && backend.isAvailable);
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
