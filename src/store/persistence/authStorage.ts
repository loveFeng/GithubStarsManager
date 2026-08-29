
import type { GitHubUser } from '../../types';

const AUTH_MIRROR_KEY = 'github-stars-manager-auth';

/** Non-sensitive auth mirror — user profile only (no tokens or secrets). */
interface AuthMirror {
  user: GitHubUser | null;
}

export const readAuthMirror = (): AuthMirror | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthMirror & { githubToken?: unknown; backendApiSecret?: unknown }>;
    return {
      user: parsed.user ?? null,
    };
  } catch {
    return null;
  }
};

export const writeAuthMirror = (auth: AuthMirror): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTH_MIRROR_KEY, JSON.stringify({ user: auth.user }));
  } catch {
    // Quota/security errors are expected in constrained environments.
  }
};

export const clearAuthMirror = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_MIRROR_KEY);
  } catch {
    // ignore
  }
};

/** @deprecated Session auth uses HttpOnly cookies; kept for migration cleanup. */
export const readSessionBackendSecret = (): string | null => null;

/** @deprecated Session auth uses HttpOnly cookies. */
export const writeSessionBackendSecret = (_secret: string | null = null): void => {
  void _secret;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem('github-stars-manager-backend-secret');
  } catch {
    // ignore
  }
};
