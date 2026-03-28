import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyProfileRedirect from '../src/pages/MyProfileRedirect';

const { mockNavigate, mockUseNavigate, mockUseTranslation } = vi.hoisted(
  () => ({
    mockNavigate: vi.fn(),
    mockUseNavigate: vi.fn(),
    mockUseTranslation: vi.fn(),
  }),
);

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
    localStorage.clear();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders the loading state', () => {
    localStorage.setItem('token', 'test-token');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ username: 'vaishnavi', id: 'user-1' }),
    });

    render(<MyProfileRedirect />);

    expect(screen.getByText('messages.loadingProfile')).toBeInTheDocument();
  });

  it('redirects to the current user profile and stores the username', async () => {
    localStorage.setItem('token', 'test-token');
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

    expect(localStorage.getItem('username')).toBe('vaishnavi');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the user id when username is missing', async () => {
    localStorage.setItem('token', 'test-token');
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

    expect(localStorage.getItem('username')).toBeNull();
  });

  it('redirects to login when there is no token', async () => {
    render(<MyProfileRedirect />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects to login when fetching the user fails', async () => {
    localStorage.setItem('token', 'test-token');
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
