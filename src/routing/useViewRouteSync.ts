import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { pathToView, viewToPath } from './viewRoutes';

/**
 * Keeps Zustand `currentView` aligned with the React Router URL.
 * URL is the navigation source of truth; use `useAppNavigation()` for programmatic moves.
 */
export function useViewRouteSync(hasHydrated: boolean): void {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useAppStore((state) => state.currentView);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const migratedPersistedView = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;

    const normalized = location.pathname.replace(/\/+$/, '') || '/';

    if (normalized === '/subscription') {
      navigate('/discovery', { replace: true });
      return;
    }

    const viewFromPath = pathToView(location.pathname);
    if (viewFromPath && viewFromPath !== currentView) {
      setCurrentView(viewFromPath);
    }
  }, [hasHydrated, location.pathname, currentView, setCurrentView, navigate]);

  // One-time migration: persisted currentView → canonical URL on cold load
  useEffect(() => {
    if (!hasHydrated || migratedPersistedView.current) return;
    migratedPersistedView.current = true;

    const normalized = location.pathname.replace(/\/+$/, '') || '/';
    if (normalized !== '/' && normalized !== '/repositories') return;

    if (currentView === 'subscription') {
      navigate('/discovery', { replace: true });
      return;
    }

    if (currentView !== 'repositories') {
      navigate(viewToPath(currentView), { replace: true });
    }
  }, [hasHydrated, currentView, location.pathname, navigate]);
}
