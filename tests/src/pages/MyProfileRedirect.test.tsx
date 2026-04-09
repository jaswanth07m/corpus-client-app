import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyProfileRedirect from '@/pages/MyProfileRedirect';

const { mockLocalStorage, mockNavigate, mockUseNavigate, mockUseTranslation } =
  vi.hoisted(() => {
    const storage = new Map<string, string>();

    return {
      mockLocalStorage: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
          storage.delete(key);
        }),
        clear: vi.fn(() => {
          storage.clear();
        }),
      },
      mockNavigate: vi.fn(),
      mockUseNavigate: vi.fn(),
      mockUseTranslation: vi.fn(),
    };
  });

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );

  return {
    ...actual,
    useNavigate: mockUseNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('MyProfileRedirect', () => {
  const fetchMock = vi.fn();
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', mockLocalStorage);
    mockLocalStorage.clear();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders the loading state', () => {
    mockLocalStorage.setItem('token', 'test-token');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ username: 'vaishnavi', id: 'user-1' }),
    });

    render(<MyProfileRedirect />);

    expect(screen.getByText('messages.loadingProfile')).toBeInTheDocument();
  });

  it('redirects to the current user profile and stores the username', async () => {
    mockLocalStorage.setItem('token', 'test-token');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ username: 'vaishnavi', id: 'user-1' }),
    });

    render(<MyProfileRedirect />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile/vaishnavi', {
        replace: true,
      });
    });

    expect(mockLocalStorage.getItem('username')).toBe('vaishnavi');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the user id when username is missing', async () => {
    mockLocalStorage.setItem('token', 'test-token');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'user-123' }),
    });

    render(<MyProfileRedirect />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile/user-123', {
        replace: true,
      });
    });

    expect(mockLocalStorage.getItem('username')).toBeNull();
  });

  it('redirects to login when there is no token', async () => {
    render(<MyProfileRedirect />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects to login when fetching the user fails', async () => {
    mockLocalStorage.setItem('token', 'test-token');
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<MyProfileRedirect />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
