import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { AppState } from '../types';
import { menuIdToPath, type SettingsTab, viewToPath } from './viewRoutes';

/** Navigate to an app view, updating both the URL and Zustand currentView. */
export function useAppNavigation() {
  const navigate = useNavigate();
  const setCurrentView = useAppStore((state) => state.setCurrentView);

  const navigateToView = useCallback((
    view: AppState['currentView'],
    options?: { settingsTab?: SettingsTab; replace?: boolean },
  ) => {
    setCurrentView(view);
    const path = view === 'settings'
      ? viewToPath('settings', options?.settingsTab)
      : viewToPath(view);
    navigate(path, { replace: options?.replace });
  }, [navigate, setCurrentView]);

  const navigateToMenuId = useCallback((
    menuId: string,
    options?: { settingsTab?: SettingsTab; replace?: boolean },
  ) => {
    const view = menuId === 'subscription' ? 'subscription' : menuId as AppState['currentView'];
    setCurrentView(view);
    navigate(menuIdToPath(menuId, options?.settingsTab), { replace: options?.replace });
  }, [navigate, setCurrentView]);

  return { navigateToView, navigateToMenuId, navigate };
}
