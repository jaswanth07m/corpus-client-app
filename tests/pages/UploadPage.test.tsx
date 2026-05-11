import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UploadPage from '../../src/pages/UploadPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock useAuth hook
const useAuthMock = vi.fn(() => ({
  token: 'mock-token-12345',
  logout: vi.fn(),
  user: { id: 'user-123', name: 'Test User' },
  login: vi.fn(),
  isReady: true,
  refetchUser: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

// Mock Navigate component
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => navigateMock,
    Navigate: vi.fn(({ to, replace }) => {
      navigateMock(to, { replace });
      return null;
    }),
  };
});

// Mock Categories component
const onBackMock = vi.fn();
const onLogoutMock = vi.fn();
const onSessionExpiredMock = vi.fn();

vi.mock('@/components/Categories', () => ({
  default: ({
    token,
    preSelectedMediaType,
    onBack,
    onLogout,
    onSessionExpired,
  }: {
    token: string;
    preSelectedMediaType?: string;
    onBack: () => void;
    onLogout: () => void;
    onSessionExpired: () => void;
  }) => (
    <div data-testid="categories-component">
      <span data-testid="token-value">{token}</span>
      <span data-testid="media-type-value">
        {preSelectedMediaType || 'none'}
      </span>
      <button data-testid="back-button" onClick={onBack}>
        Back
      </button>
      <button data-testid="logout-button" onClick={onLogout}>
        Logout
      </button>
      <button data-testid="session-expired-button" onClick={onSessionExpired}>
        Session Expired
      </button>
    </div>
  ),
}));

const renderWithRouter = (
  component: React.ReactElement,
  initialEntries: string[] = ['/upload/text'],
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/upload/:mediaType?" element={component} />
        <Route path="/upload" element={<div data-testid="upload-redirect" />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('UploadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
    onBackMock.mockClear();
    onLogoutMock.mockClear();
    onSessionExpiredMock.mockClear();
  });

  describe('Rendering with valid media type', () => {
    it('should render Categories component with valid media type "text"', () => {
      renderWithRouter(<UploadPage />, ['/upload/text']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should render Categories component with valid media type "audio"', () => {
      renderWithRouter(<UploadPage />, ['/upload/audio']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should render Categories component with valid media type "video"', () => {
      renderWithRouter(<UploadPage />, ['/upload/video']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should render Categories component with valid media type "image"', () => {
      renderWithRouter(<UploadPage />, ['/upload/image']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should render Categories component with valid media type "document"', () => {
      renderWithRouter(<UploadPage />, ['/upload/document']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should pass the correct media type to Categories component', () => {
      renderWithRouter(<UploadPage />, ['/upload/audio']);
      expect(screen.getByTestId('media-type-value')).toHaveTextContent('audio');
    });

    it('should pass the authentication token to Categories component', () => {
      renderWithRouter(<UploadPage />, ['/upload/text']);
      expect(screen.getByTestId('token-value')).toHaveTextContent(
        'mock-token-12345',
      );
    });
  });

  describe('Navigation callbacks', () => {
    it('should call navigate with /upload when onBack is triggered', () => {
      renderWithRouter(<UploadPage />, ['/upload/text']);
      fireEvent.click(screen.getByTestId('back-button'));
      expect(navigateMock).toHaveBeenCalledWith('/upload');
    });

    it('should call logout when onLogout is triggered', () => {
      const logoutMock = vi.fn();
      useAuthMock.mockReturnValue({
        token: 'mock-token-12345',
        logout: logoutMock,
        user: { id: 'user-123', name: 'Test User' },
        login: vi.fn(),
        isReady: true,
        refetchUser: vi.fn(),
      });

      renderWithRouter(<UploadPage />, ['/upload/text']);
      fireEvent.click(screen.getByTestId('logout-button'));
      expect(logoutMock).toHaveBeenCalled();
    });

    it('should call logout and navigate to login when session expires', () => {
      const logoutMock = vi.fn();
      useAuthMock.mockReturnValue({
        token: 'mock-token-12345',
        logout: logoutMock,
        user: { id: 'user-123', name: 'Test User' },
        login: vi.fn(),
        isReady: true,
        refetchUser: vi.fn(),
      });

      renderWithRouter(<UploadPage />, ['/upload/text']);
      fireEvent.click(screen.getByTestId('session-expired-button'));
      expect(logoutMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  describe('Invalid or missing media type', () => {
    it('should redirect to /upload when media type is missing', () => {
      renderWithRouter(<UploadPage />, ['/upload/']);
      expect(navigateMock).toHaveBeenCalledWith('/upload', { replace: true });
    });

    it('should redirect to /upload when media type is invalid', () => {
      renderWithRouter(<UploadPage />, ['/upload/invalid']);
      expect(navigateMock).toHaveBeenCalledWith('/upload', { replace: true });
    });

    it('should redirect to /upload for unknown media types', () => {
      renderWithRouter(<UploadPage />, ['/upload/unknown']);
      expect(navigateMock).toHaveBeenCalledWith('/upload', { replace: true });
    });

    it('should not render Categories component when media type is invalid', () => {
      renderWithRouter(<UploadPage />, ['/upload/invalid']);
      expect(
        screen.queryByTestId('categories-component'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Media type validation', () => {
    it('should accept "text" as a valid media type', () => {
      renderWithRouter(<UploadPage />, ['/upload/text']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
      expect(screen.queryByTestId('upload-redirect')).not.toBeInTheDocument();
    });

    it('should accept "audio" as a valid media type', () => {
      renderWithRouter(<UploadPage />, ['/upload/audio']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should accept "video" as a valid media type', () => {
      renderWithRouter(<UploadPage />, ['/upload/video']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should accept "image" as a valid media type', () => {
      renderWithRouter(<UploadPage />, ['/upload/image']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should accept "document" as a valid media type', () => {
      renderWithRouter(<UploadPage />, ['/upload/document']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should reject media types with different casing', () => {
      renderWithRouter(<UploadPage />, ['/upload/TEXT']);
      expect(navigateMock).toHaveBeenCalledWith('/upload', { replace: true });
    });
  });

  describe('Authentication', () => {
    it('should use useAuth hook to get token and logout function', () => {
      renderWithRouter(<UploadPage />, ['/upload/text']);
      expect(useAuthMock).toHaveBeenCalled();
    });

    it('should pass token from useAuth to Categories component', () => {
      useAuthMock.mockReturnValue({
        token: 'test-token-xyz',
        logout: vi.fn(),
        user: { id: 'user-123', name: 'Test User' },
        login: vi.fn(),
        isReady: true,
        refetchUser: vi.fn(),
      });

      renderWithRouter(<UploadPage />, ['/upload/text']);
      expect(screen.getByTestId('token-value')).toHaveTextContent(
        'test-token-xyz',
      );
    });

    it('should handle missing token gracefully', () => {
      useAuthMock.mockReturnValue({
        token: null,
        logout: vi.fn(),
        user: null,
        login: vi.fn(),
        isReady: true,
        refetchUser: vi.fn(),
      });

      // This should not crash even with null token
      expect(() =>
        renderWithRouter(<UploadPage />, ['/upload/text']),
      ).not.toThrow();
    });
  });

  describe('Component structure', () => {
    it('should be a functional component', () => {
      expect(typeof UploadPage).toBe('function');
    });

    it('should export as default export', () => {
      expect(UploadPage).toBeDefined();
    });

    it('should render without crashing for valid media type', () => {
      expect(() =>
        renderWithRouter(<UploadPage />, ['/upload/text']),
      ).not.toThrow();
    });

    it('should render without crashing for invalid media type', () => {
      expect(() =>
        renderWithRouter(<UploadPage />, ['/upload/invalid']),
      ).not.toThrow();
    });

    it('should handle multiple renders', () => {
      const { rerender } = renderWithRouter(<UploadPage />, ['/upload/text']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
      expect(() => rerender(<UploadPage />)).not.toThrow();
    });
  });

  describe('Route handling', () => {
    it('should handle route with trailing slash', () => {
      renderWithRouter(<UploadPage />, ['/upload/text/']);
      expect(screen.getByTestId('categories-component')).toBeInTheDocument();
    });

    it('should handle route parameters correctly', () => {
      renderWithRouter(<UploadPage />, ['/upload/video']);
      expect(screen.getByTestId('media-type-value')).toHaveTextContent('video');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string media type', () => {
      renderWithRouter(<UploadPage />, ['/upload/']);
      expect(navigateMock).toHaveBeenCalledWith('/upload', { replace: true });
    });

    it('should handle media type with special characters', () => {
      renderWithRouter(<UploadPage />, ['/upload/text@123']);
      expect(navigateMock).toHaveBeenCalledWith('/upload', { replace: true });
    });

    it('should handle media type with spaces', () => {
      renderWithRouter(<UploadPage />, ['/upload/text%20file']);
      expect(navigateMock).toHaveBeenCalledWith('/upload', { replace: true });
    });

    it('should handle numeric media type', () => {
      renderWithRouter(<UploadPage />, ['/upload/123']);
      expect(navigateMock).toHaveBeenCalledWith('/upload', { replace: true });
    });
  });

  describe('Logout functionality', () => {
    it('should pass logout function from useAuth to Categories', () => {
      const logoutFn = vi.fn();
      useAuthMock.mockReturnValue({
        token: 'mock-token',
        logout: logoutFn,
        user: null,
        login: vi.fn(),
        isReady: true,
        refetchUser: vi.fn(),
      });

      renderWithRouter(<UploadPage />, ['/upload/text']);
      fireEvent.click(screen.getByTestId('logout-button'));
      expect(logoutFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session expiration handling', () => {
    it('should navigate to login page with replace option on session expiry', () => {
      const logoutFn = vi.fn();
      useAuthMock.mockReturnValue({
        token: 'mock-token',
        logout: logoutFn,
        user: null,
        login: vi.fn(),
        isReady: true,
        refetchUser: vi.fn(),
      });

      renderWithRouter(<UploadPage />, ['/upload/text']);
      fireEvent.click(screen.getByTestId('session-expired-button'));
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should call logout before navigating on session expiry', () => {
      const logoutFn = vi.fn();
      useAuthMock.mockReturnValue({
        token: 'mock-token',
        logout: logoutFn,
        user: null,
        login: vi.fn(),
        isReady: true,
        refetchUser: vi.fn(),
      });

      renderWithRouter(<UploadPage />, ['/upload/text']);
      fireEvent.click(screen.getByTestId('session-expired-button'));
      expect(logoutFn).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });
  });
});
