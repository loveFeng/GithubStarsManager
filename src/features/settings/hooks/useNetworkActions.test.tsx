import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNetworkActions } from './useNetworkActions';
import { useAppStore } from '../../../store/useAppStore';

const mocks = vi.hoisted(() => ({
  useAppStore: vi.fn(),
  setProxyConfig: vi.fn(),
  setRpcDownloadConfig: vi.fn(),
  backendInit: vi.fn(),
  testRpcDownload: vi.fn(),
}));

vi.mock('../../../store/useAppStore', () => ({ useAppStore: mocks.useAppStore }));
vi.mock('../../../services/backendAdapter', () => ({
  backend: {
    isAvailable: true,
    backendUrl: 'http://localhost:3000/api',
    init: mocks.backendInit,
  },
}));
vi.mock('../../../services/rpcDownloadService', () => ({ testRpcDownload: mocks.testRpcDownload }));

const proxyConfig = {
  enabled: true,
  type: 'http' as const,
  host: '127.0.0.1',
  port: 7890,
  username: 'user',
  password: 'proxy-password',
};
const rpcDownloadConfig = {
  enabled: true,
  host: '127.0.0.1',
  port: 6800,
  secret: 'rpc-secret',
};

const storeState = {
  proxyConfig,
  setProxyConfig: mocks.setProxyConfig,
  rpcDownloadConfig,
  setRpcDownloadConfig: mocks.setRpcDownloadConfig,
  backendApiSecret: null,
};

const mockUseAppStore = vi.mocked(useAppStore);

describe('useNetworkActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.backendInit.mockResolvedValue(undefined);
    mockUseAppStore.mockImplementation(((selector?: (state: typeof storeState) => unknown) => (
      selector ? selector(storeState) : storeState
    )) as typeof useAppStore);
    Object.assign(mockUseAppStore, { getState: () => storeState });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    })));
  });

  it('exposes proxy controls when backend is available', async () => {
    const { result } = renderHook(() => useNetworkActions({ t: (zh) => zh }));

    expect(result.current.canUseProxy).toBe(true);
    await act(async () => { await result.current.testRpc(); });
    expect(mocks.testRpcDownload).toHaveBeenCalledWith(rpcDownloadConfig, undefined);
  });

  it('persists proxy password through the store after a successful backend save', async () => {
    const { result } = renderHook(() => useNetworkActions({ t: (zh) => zh }));

    await act(async () => { await result.current.saveProxy(); });

    expect(mocks.setProxyConfig).toHaveBeenCalledWith(expect.objectContaining({ password: 'proxy-password' }));
  });

  it('keeps RPC secret in the store partialize path after save', async () => {
    const { result } = renderHook(() => useNetworkActions({ t: (zh) => zh }));

    await act(async () => { await result.current.saveRpc(); });

    expect(mocks.setRpcDownloadConfig).toHaveBeenCalledWith(expect.objectContaining({ secret: 'rpc-secret' }));
  });
});
