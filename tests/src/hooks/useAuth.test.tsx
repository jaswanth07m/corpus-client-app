import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { AuthProvider, useAuth } from '../../../src/hooks/useAuth';

const { mockAxiosInstance, localStorageMock, interceptorsStore } = vi.hoisted(
  () => {
    let store: Record<string, string> = {};
    const interceptorsStore: {
      success: ((val: unknown) => unknown) | null;
      error: ((err: unknown) => unknown) | null;
    } = { success: null, error: null };
    return {
      interceptorsStore,
      mockAxiosInstance: {
        get: vi.fn(),
        interceptors: {
          request: {
            use: vi.fn((success, error) => {
              interceptorsStore.success = success;
              interceptorsStore.error = error;
            }),
          },
        },
      },
      localStorageMock: {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
        get length() {
          return Object.keys(store).length;
        },
      },
    };
  },
);

vi.stubGlobal('localStorage', localStorageMock);

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws error when useAuth is used outside of AuthProvider', () => {
    const originalError = console.error;
    console.error = vi.fn(); // Suppress React error log overlay

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used inside AuthProvider',
    );

    console.error = originalError;
  });

  describe('interceptors', () => {
    it('adds Authorization header if token exists in localStorage', () => {
      localStorage.setItem('token', 'interceptor-token');
      const config = { headers: {} as Record<string, string> };

      const updatedConfig = interceptorsStore.success!(config) as {
        headers: Record<string, string>;
      };
      expect(updatedConfig.headers.Authorization).toBe(
        'Bearer interceptor-token',
      );
    });

    it('does not add Authorization header if no token in localStorage', () => {
      const config = { headers: {} as Record<string, string> };

      const updatedConfig = interceptorsStore.success!(config) as {
        headers: Record<string, string>;
      };
      expect(updatedConfig.headers.Authorization).toBeUndefined();
    });

    it('rejects errors in interceptor correctly', async () => {
      const testError = new Error('interceptor error');
      await expect(interceptorsStore.error!(testError)).rejects.toThrow(
        'interceptor error',
      );
    });
  });

  describe('initialization', () => {
    it('initializes seamlessly when no token is present', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        // flush promises
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.isReady).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('successfully fetches user profile and sets state when token exists', async () => {
      localStorage.setItem('token', 'valid-token');

      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url === '/auth/me')
          return Promise.resolve({
            data: { id: 'user-123', name: 'Valid User' },
          });
        if (url.includes('/profile'))
          return Promise.resolve({ data: { user_name: 'Detailed Name' } });
        return Promise.reject(new Error('not mocked'));
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isReady).toBe(false);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.isReady).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user-123',
        name: 'Valid User',
        username: undefined,
        streaks: undefined,
        summary: undefined,
        timeline: undefined,
      });
      expect(result.current.token).toBe('valid-token');
    });

    it('falls back to profileData properties when basicData properties are missing', async () => {
      localStorage.setItem('token', 'valid-token');

      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url === '/auth/me')
          return Promise.resolve({ data: { id: 'user-123' } });
        if (url.includes('/profile'))
          return Promise.resolve({
            data: { user_name: 'ProfileName', username: 'ProfileUsername' },
          });
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.user?.name).toBe('ProfileName');
      expect(result.current.user?.username).toBe('ProfileUsername');
    });

    it('properly identifies user_id over id if available', async () => {
      localStorage.setItem('token', 'valid-token');

      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url === '/auth/me')
          return Promise.resolve({
            data: { id: 'user-123', user_id: 'real-user-id' },
          });
        if (url.includes('/profile')) return Promise.resolve({ data: {} });
      });

      renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.user?.user_id).toBe('real-user-id');
    });

    it('handles initialization correctly if detailed profile request fails, keeping basic user data', async () => {
      localStorage.setItem('token', 'valid-token');

      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url === '/auth/me')
          return Promise.resolve({ data: { id: 'user-123', name: 'Basic' } });
        if (url.includes('/profile'))
          return Promise.reject(new Error('Profile connection error'));
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.user?.name).toBe('Basic');
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to fetch detailed profile, falling back to basic data',
        expect.any(Error),
      );
    });

    it('clears session states when /auth/me fails (Invalid Token)', async () => {
      localStorage.setItem('token', 'invalid-token');
      localStorage.setItem('user', 'old-user-data');

      mockAxiosInstance.get.mockRejectedValue(new Error('401 Unauthorized'));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        'Auth validation failed',
        expect.any(Error),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching user profile:',
        expect.any(Error),
      );
    });
  });

  describe('login', () => {
    it('updates user state seamlessly with successful login response', async () => {
      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url === '/auth/me')
          return Promise.resolve({
            data: { id: 'logged-in-1', name: 'Logged in User' },
          });
        if (url.includes('/profile')) return Promise.resolve({ data: {} });
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('new-token', { id: 'dummy' });
      });

      expect(result.current.token).toBe('new-token');
      expect(result.current.user?.name).toBe('Logged in User');

      expect(localStorage.getItem('token')).toBe('new-token');
      const localStorageUser = JSON.parse(localStorage.getItem('user')!);
      expect(localStorageUser.id).toBe('logged-in-1');
    });

    it('handles unexpected errors dynamically during login process', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        new Error('Login networking error'),
      );
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('bad-token', { id: 'dummy' });
      });

      expect(errorSpy).toHaveBeenCalledWith(
        'Error during login:',
        expect.any(Error),
      );
    });
  });

  describe('logout', () => {
    it('wipes everything clean on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(localStorage.length).toBe(0);
    });
  });

  describe('refetchUser', () => {
    it('returns empty operations dynamically if no token is initially set', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      mockAxiosInstance.get.mockClear();

      await act(async () => {
        await result.current.refetchUser();
      });

      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('completely refreshes context token when valid token limits exist natively', async () => {
      localStorage.setItem('token', 'refetch-token');

      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url === '/auth/me')
          return Promise.resolve({ data: { id: 'user-refetch' } });
        if (url.includes('/profile')) return Promise.resolve({ data: {} });
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Init finishes
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Update mock to return new data on refetch
      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url === '/auth/me')
          return Promise.resolve({
            data: { id: 'user-refetch', name: 'Refetched Success Name' },
          });
        if (url.includes('/profile')) return Promise.resolve({ data: {} });
      });

      await act(async () => {
        await result.current.refetchUser();
      });

      expect(result.current.user?.name).toBe('Refetched Success Name');
      const localStorageUser = JSON.parse(localStorage.getItem('user')!);
      expect(localStorageUser.name).toBe('Refetched Success Name');
    });

    it('gracefully consoles network disruptions specifically inside refetch limits', async () => {
      localStorage.setItem('token', 'refetch-token');

      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url === '/auth/me')
          return Promise.resolve({ data: { id: 'user-refetch' } });
        if (url.includes('/profile')) return Promise.resolve({ data: {} });
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      mockAxiosInstance.get.mockRejectedValue(
        new Error('Refetch server offline error block'),
      );
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        await result.current.refetchUser();
      });

      expect(errorSpy).toHaveBeenCalledWith(
        'Error refetching user data:',
        expect.any(Error),
      );
    });
  });
});
