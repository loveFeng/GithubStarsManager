import React, { Suspense, useEffect, useCallback } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useViewRouteSync } from './routing/useViewRouteSync';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { RepositoryList } from './components/RepositoryList';
import { CategorySidebar } from './components/CategorySidebar';

import { DebugModeIndicator } from './components/DebugModeIndicator';

import { BackToTop } from './components/BackToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SyncModeChoiceModal } from './components/SyncModeChoiceModal';
import { useAppStore } from './store/useAppStore';
import { selectAppShellState } from './store/selectors';
import { useShallow } from 'zustand/react/shallow';
import { applyThemePreset } from './lib/themePresets';
import { useAutoUpdateCheck } from './hooks/useAutoUpdateCheck';
import { logger } from './services/logger';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { ListsPushIndicator } from './components/ListsPushIndicator';
import { useBackendLifecycle } from './features/lifecycle/useBackendLifecycle';
import type { AppState } from './types';
import { hasActiveSearchFilters } from './utils/repoSearch';
import { Button } from './components/ui/button';

const LazyReleaseTimeline = React.lazy(() =>
  import('./components/ReleaseTimeline').then((module) => ({ default: module.ReleaseTimeline }))
);
const LazyForkTimeline = React.lazy(() =>
  import('./components/ForkTimeline').then((module) => ({ default: module.ForkTimeline }))
);
const LazySettingsPanel = React.lazy(() =>
  import('./components/SettingsPanel').then((module) => ({ default: module.SettingsPanel }))
);
const LazyDiscoveryView = React.lazy(() =>
  import('./components/DiscoveryView').then((module) => ({ default: module.DiscoveryView }))
);
const LazyGistView = React.lazy(() =>
  import('./components/GistView').then((module) => ({ default: module.GistView }))
);

const ViewLoadingFallback: React.FC = () => (
  <div className="flex min-h-[12rem] items-center justify-center bg-background text-foreground" role="status" aria-live="polite">
    <div className="animate-pulse text-lg font-medium text-foreground">Loading...</div>
  </div>
);

const LazyViewBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<ViewLoadingFallback />}>{children}</Suspense>
  </ErrorBoundary>
);

const BackendUnavailableScreen: React.FC<{
  language: 'zh' | 'en';
  onRetry: () => void;
}> = ({ language, onRetry }) => {
  const t = (zh: string, en: string) => (language === 'zh' ? zh : en);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">{t('无法连接后端服务', 'Backend unavailable')}</h1>
        <p className="text-sm text-muted-foreground">
          {t(
            '本应用需要同源 API 服务。请确认 Docker 单镜像已启动，且 /api/health 可访问。',
            'This app requires the same-origin API. Ensure the single Docker image is running and /api/health is reachable.'
          )}
        </p>
        <Button type="button" onClick={onRetry}>{t('重试', 'Retry')}</Button>
      </div>
    </div>
  );
};

/**
 * Main repository view combining category sidebar, search bar, and repository list.
 * Switches between search results and full list based on active search filters.
 */
const RepositoriesView = React.memo(({
  repositories,
  searchResults,
  searchFilters,
  selectedCategory,
  onCategorySelect
}: {
  repositories: AppState['repositories'];
  searchResults: AppState['searchResults'];
  searchFilters: AppState['searchFilters'];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}) => {
  const isActive = hasActiveSearchFilters(searchFilters);
  const similarView = useAppStore((state) => state.similarView);
  const exitSimilarView = useAppStore((state) => state.exitSimilarView);

  useEffect(() => {
    if (similarView?.active && isActive) {
      exitSimilarView();
    }
  }, [similarView?.active, isActive, exitSimilarView]);

  const listRepositories = similarView?.active
    ? similarView.similarResults
    : (isActive ? searchResults : repositories);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <CategorySidebar
        repositories={repositories}
        selectedCategory={selectedCategory}
        onCategorySelect={onCategorySelect}
      />
      <div className="flex-1 space-y-6">
        <SearchBar />
        <RepositoryList
          repositories={listRepositories}
          selectedCategory={similarView?.active ? 'all' : selectedCategory}
        />
      </div>
    </div>
  );
});
RepositoriesView.displayName = 'RepositoriesView';

const ReleasesView = React.memo(() => (
  <LazyViewBoundary>
    <LazyReleaseTimeline />
  </LazyViewBoundary>
));
ReleasesView.displayName = 'ReleasesView';

const GistsView = React.memo(() => (
  <LazyViewBoundary>
    <LazyGistView />
  </LazyViewBoundary>
));
GistsView.displayName = 'GistsView';

const ForksView = React.memo(() => (
  <LazyViewBoundary>
    <LazyForkTimeline />
  </LazyViewBoundary>
));
ForksView.displayName = 'ForksView';

const SettingsView = React.memo(() => (
  <LazyViewBoundary>
    <LazySettingsPanel />
  </LazyViewBoundary>
));
SettingsView.displayName = 'SettingsView';

const DiscoverySubscriptionView = React.memo(() => (
  <Suspense fallback={<ViewLoadingFallback />}>
    <LazyDiscoveryView />
  </Suspense>
));
DiscoverySubscriptionView.displayName = 'DiscoverySubscriptionView';

function App() {
  const {
    isAuthenticated,
    currentView,
    selectedCategory,
    theme,
    themePreset,
    hasHydrated,
    searchResults,
    searchFilters,
    repositories,
    setSelectedCategory,
    language,
  } = useAppStore(useShallow((state) => ({
    ...selectAppShellState(state),
    language: state.language,
  })));

  useAutoUpdateCheck();
  useViewRouteSync(hasHydrated);
  const { status: backendStatus, retry: retryBackend } = useBackendLifecycle(hasHydrated);

  useEffect(() => {
    if (sessionStorage.getItem('gsm:frontend-debug') === 'true') {
      logger.setLevel('debug');
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    applyThemePreset(themePreset);
  }, [themePreset]);

  const handleCategorySelect = useCallback((category: string) => {
    if (useAppStore.getState().similarView?.active) {
      useAppStore.getState().exitSimilarView();
    }
    setSelectedCategory(category);
  }, [setSelectedCategory]);

  useEffect(() => {
    const titles: Record<string, { zh: string; en: string }> = {
      repositories: { zh: '仓库', en: 'Repositories' },
      gists: { zh: 'Gist', en: 'Gist' },
      releases: { zh: '发布', en: 'Releases' },
      forks: { zh: '复刻', en: 'Forks' },
      subscription: { zh: '发现', en: 'Discovery' },
      settings: { zh: '设置', en: 'Settings' },
    };
    const page = titles[currentView] || titles.repositories;
    document.title = `${language === 'zh' ? page.zh : page.en} · GitHub Stars Manager`;
  }, [currentView, language]);

  if (!hasHydrated || backendStatus === 'idle' || backendStatus === 'connecting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground" role="status" aria-live="polite">
        <div className="animate-pulse text-lg font-medium text-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (backendStatus === 'unavailable') {
    return <BackendUnavailableScreen language={language} onRetry={retryBackend} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="ui-shell min-h-screen transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {language === 'zh' ? '跳到主要内容' : 'Skip to main content'}
      </a>
      <UpdateNotificationBanner />
      <Header />
      <main id="main-content" tabIndex={-1} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 outline-none">
        <Routes>
          <Route path="/" element={<Navigate to="/repositories" replace />} />
          <Route path="/subscription" element={<Navigate to="/discovery" replace />} />
          <Route
            path="/repositories"
            element={
              <RepositoriesView
                repositories={repositories}
                searchResults={searchResults}
                searchFilters={searchFilters}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
              />
            }
          />
          <Route path="/gists" element={<GistsView />} />
          <Route path="/releases" element={<ReleasesView />} />
          <Route path="/forks" element={<ForksView />} />
          <Route
            path="/discovery"
            element={
              <ErrorBoundary>
                <DiscoverySubscriptionView />
              </ErrorBoundary>
            }
          />
          <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
          <Route path="/settings/:tab" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/repositories" replace />} />
        </Routes>
      </main>
      <BackToTop />
      <DebugModeIndicator />
      <SyncModeChoiceModal />
      <ListsPushIndicator />
    </div>
  );
}

export default App;
