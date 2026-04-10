import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/pages/LoginPage';

const { mockLogin, mockNavigate, mockUseAuth, mockUseNavigate } = vi.hoisted(
  () => ({
    mockLogin: vi.fn(),
    mockNavigate: vi.fn(),
    mockUseAuth: vi.fn(),
    mockUseNavigate: vi.fn(),
  }),
);
const mockUser = { id: 'user-1', name: 'Test User' };
const mockToken = 'test-token';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

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

vi.mock('@/components/LoginForm', () => ({
  default: ({
    onLoginSuccess,
  }: {
    onLoginSuccess: (token: string, user: unknown) => void;
  }) => (
    <div>
      <p>Mock Login Form</p>
      <button onClick={() => onLoginSuccess(mockToken, mockUser)}>
        Trigger Login Success
      </button>
    </div>
  ),
}));

describe('LoginPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: mockLogin,
      logout: vi.fn(),
      isReady: true,
      refetchUser: vi.fn(),
    });
  });

  it('renders the login form when no token is present', () => {
    render(<LoginPage />);

    expect(screen.getByText('Mock Login Form')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects to home when a token already exists', () => {
    mockUseAuth.mockReturnValue({
      token: 'existing-token',
      user: mockUser,
      login: mockLogin,
      logout: vi.fn(),
      isReady: true,
      refetchUser: vi.fn(),
    });

    render(<LoginPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('logs in the user and redirects after login success', () => {
    render(<LoginPage />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Trigger Login Success' }),
    );

    expect(mockLogin).toHaveBeenCalledWith(mockToken, mockUser);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
