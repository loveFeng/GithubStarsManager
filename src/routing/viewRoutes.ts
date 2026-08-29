import type { AppState } from '../types';

export type AppView = AppState['currentView'];

export const SETTINGS_TABS = [
  'general',
  'starSync',
  'ai',
  'webdav',
  'backup',
  'backend',
  'category',
  'menu',
  'data',
  'logs',
  'network',
  'vectorSearch',
  'mcp',
] as const;

export type SettingsTab = typeof SETTINGS_TABS[number];

const VIEW_TO_PATH: Record<AppView, string> = {
  repositories: '/repositories',
  gists: '/gists',
  releases: '/releases',
  forks: '/forks',
  subscription: '/discovery',
  settings: '/settings',
};

/** Map a menu id (may be `subscription`) to its canonical URL path. */
export function menuIdToPath(menuId: string, settingsTab?: SettingsTab): string {
  if (menuId === 'settings') {
    return settingsTab ? `/settings/${settingsTab}` : '/settings/general';
  }
  if (menuId === 'subscription') {
    return '/discovery';
  }
  const view = menuId as AppView;
  return VIEW_TO_PATH[view] ?? '/repositories';
}

/** Resolve pathname to a Zustand currentView value. */
export function pathToView(pathname: string): AppView | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/' || normalized === '/repositories') return 'repositories';
  if (normalized === '/gists') return 'gists';
  if (normalized === '/releases') return 'releases';
  if (normalized === '/forks') return 'forks';
  if (normalized === '/discovery' || normalized === '/subscription') return 'subscription';
  if (normalized === '/settings' || normalized.startsWith('/settings/')) return 'settings';

  return null;
}

/** Extract settings tab from `/settings/:tab` or default to general. */
export function pathToSettingsTab(pathname: string): SettingsTab {
  const match = pathname.match(/^\/settings(?:\/([^/]+))?/);
  const tab = match?.[1];
  if (tab && (SETTINGS_TABS as readonly string[]).includes(tab)) {
    return tab as SettingsTab;
  }
  return 'general';
}

export function viewToPath(view: AppView, settingsTab?: SettingsTab): string {
  if (view === 'settings') {
    return menuIdToPath('settings', settingsTab ?? 'general');
  }
  return VIEW_TO_PATH[view] ?? '/repositories';
}

export function isValidSettingsTab(value: string | undefined): value is SettingsTab {
  return !!value && (SETTINGS_TABS as readonly string[]).includes(value);
}
