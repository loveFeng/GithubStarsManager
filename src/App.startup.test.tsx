import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const storeState = {
    isAuthenticated: true,
    currentView: 'repositories',
    selectedCategory: 'all',
    theme: 'light',
    themePreset: 'default',
    hasHydrated: true,
    language: 'en' as const,
    searchResults: [],
    searchFilters: {
      query: '',
      tags: [],
      languages: [],
      platforms: [],
      licenses: [],
      sortBy: 'stars',
      sortOrder: 'desc',
    },
    repositories: [],
    githubToken: 'ghp-local-token',
    setSelectedCategory: vi.fn(),
  };

  return {
    storeState,
    useAppStore: vi.fn((selector?: (state: typeof storeState) => unknown) =>
      selector ? selector(storeState) : storeState,
    ),
    useBackendLifecycle: vi.fn((): { status: 'ready' | 'unavailable' | 'connecting' | 'idle'; retry: ReturnType<typeof vi.fn> } => ({
      status: 'ready',
      retry: vi.fn(),
    })),
    useAutoUpdateCheck: vi.fn(),
    loadedViews: new Set<string>(),
  };
});

Object.assign(mocks.useAppStore, {
  getState: vi.fn(() => mocks.storeState),
});

vi.mock('./store/useAppStore', () => ({ useAppStore: mocks.useAppStore }));
vi.mock('./services/logger', () => ({
  logger: {
    setLevel: vi.fn(),
    isDebugMode: vi.fn(() => false),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    errorFromError: vi.fn(),
  },
}));
vi.mock('./hooks/useAutoUpdateCheck', () => ({ useAutoUpdateCheck: mocks.useAutoUpdateCheck }));
vi.mock('./features/lifecycle/useBackendLifecycle', () => ({
  useBackendLifecycle: mocks.useBackendLifecycle,
}));
vi.mock('./routing/useViewRouteSync', () => ({
  useViewRouteSync: vi.fn(),
}));

vi.mock('./components/LoginScreen', () => ({ LoginScreen: () => null }));
vi.mock('./components/Header', () => ({ Header: () => null }));
vi.mock('./components/SearchBar', () => ({ SearchBar: () => null }));
vi.mock('./components/RepositoryList', () => ({ RepositoryList: () => <div data-testid="repositories-view" /> }));
vi.mock('./components/CategorySidebar', () => ({ CategorySidebar: () => null }));
vi.mock('./components/ReleaseTimeline', () => {
  mocks.loadedViews.add('releases');
  return { ReleaseTimeline: () => <div data-testid="releases-view" /> };
});
vi.mock('./components/ForkTimeline', () => {
  mocks.loadedViews.add('forks');
  return { ForkTimeline: () => <div data-testid="forks-view" /> };
});
vi.mock('./components/SettingsPanel', () => {
  mocks.loadedViews.add('settings');
  return { SettingsPanel: () => <div data-testid="settings-view" /> };
});
vi.mock('./components/DebugModeIndicator', () => ({ DebugModeIndicator: () => null }));
vi.mock('./components/DiscoveryView', () => {
  mocks.loadedViews.add('subscription');
  return { DiscoveryView: () => <div data-testid="subscription-view" /> };
});
vi.mock('./components/GistView', () => {
  mocks.loadedViews.add('gists');
  return { GistView: () => <div data-testid="gists-view" /> };
});
vi.mock('./components/BackToTop', () => ({ BackToTop: () => null }));
vi.mock('./components/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: { children: unknown }) => children }));
vi.mock('./components/SyncModeChoiceModal', () => ({ SyncModeChoiceModal: () => null }));
vi.mock('./components/UpdateNotificationBanner', () => ({ UpdateNotificationBanner: () => null }));
vi.mock('./components/ListsPushIndicator', () => ({ ListsPushIndicator: () => null }));
vi.mock('./components/ui/button', () => ({
  Button: ({ children, ...props }: { children?: unknown }) => <button type="button" {...props}>{children as never}</button>,
}));

import App from './App';

function renderApp(initialPath = '/repositories') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storeState.currentView = 'repositories';
    mocks.storeState.isAuthenticated = true;
    mocks.storeState.hasHydrated = true;
    mocks.loadedViews.clear();
    mocks.useBackendLifecycle.mockReturnValue({ status: 'ready', retry: vi.fn() });
  });

  it('shows backend unavailable screen when lifecycle reports unavailable', () => {
    mocks.useBackendLifecycle.mockReturnValue({ status: 'unavailable', retry: vi.fn() });
    renderApp();
    expect(screen.getByRole('heading', { name: /backend unavailable|无法连接后端/i })).toBeInTheDocument();
  });

  it('renders repositories before dormant views load, then resolves every lazy primary view after a view switch', async () => {
    renderApp('/repositories');

    expect(screen.getByTestId('repositories-view')).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
    expect(mocks.loadedViews).toEqual(new Set());

    const lazyViews = [
      ['/settings/general', 'settings', 'settings-view'],
      ['/discovery', 'subscription', 'subscription-view'],
      ['/gists', 'gists', 'gists-view'],
      ['/releases', 'releases', 'releases-view'],
      ['/forks', 'forks', 'forks-view'],
    ] as const;

    for (const [path, currentView, testId] of lazyViews) {
      mocks.storeState.currentView = currentView;
      const { unmount } = renderApp(path);
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByTestId(testId)).toBeInTheDocument();
      expect(mocks.loadedViews).toContain(currentView);
      unmount();
    }
  });
});
