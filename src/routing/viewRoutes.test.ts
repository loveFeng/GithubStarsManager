import { describe, expect, it } from 'vitest';
import {
  isValidSettingsTab,
  menuIdToPath,
  pathToSettingsTab,
  pathToView,
  viewToPath,
} from './viewRoutes';

describe('viewRoutes', () => {
  it('maps views to canonical paths', () => {
    expect(viewToPath('repositories')).toBe('/repositories');
    expect(viewToPath('subscription')).toBe('/discovery');
    expect(viewToPath('settings', 'logs')).toBe('/settings/logs');
  });

  it('maps paths back to currentView values', () => {
    expect(pathToView('/discovery')).toBe('subscription');
    expect(pathToView('/subscription')).toBe('subscription');
    expect(pathToView('/settings/ai')).toBe('settings');
  });

  it('routes subscription menu id to discovery', () => {
    expect(menuIdToPath('subscription')).toBe('/discovery');
  });

  it('parses settings tab from URL', () => {
    expect(pathToSettingsTab('/settings/mcp')).toBe('mcp');
    expect(pathToSettingsTab('/settings')).toBe('general');
    expect(isValidSettingsTab('network')).toBe(true);
    expect(isValidSettingsTab('invalid')).toBe(false);
  });
});
