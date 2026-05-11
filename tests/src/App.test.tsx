import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all heavy dependencies before importing App
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));
vi.mock('@/components/ui/sonner', () => ({
  Toaster: ({ position }: { position: string }) => (
    <div data-testid="sonner" data-position={position} />
  ),
}));
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock('@tanstack/react-query', () => ({
  QueryClient: class QueryClient {
    constructor() {}
  },
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="browser-router">{children}</div>
  ),
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: () => null,
  Navigate: () => null,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/login' }),
}));

vi.mock('@/hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => ({ token: null, isReady: true }),
}));

vi.mock('@/pages/Index', () => ({ default: () => <div>Index</div> }));
vi.mock('@/pages/LandingPage', () => ({
  default: () => <div>LandingPage</div>,
}));
vi.mock('@/pages/NotFound', () => ({ default: () => <div>NotFound</div> }));
vi.mock('@/pages/ForgotPassword', () => ({
  default: () => <div>ForgotPassword</div>,
}));
vi.mock('@/pages/DocDigitization', () => ({
  default: () => <div>DocDigitization</div>,
}));
vi.mock('@/pages/AnnotationsDashboard', () => ({
  default: () => <div>AnnotationsDashboard</div>,
}));
vi.mock('@/pages/Profile', () => ({ default: () => <div>Profile</div> }));
vi.mock('@/pages/MyProfileRedirect', () => ({
  default: () => <div>MyProfileRedirect</div>,
}));
vi.mock('@/pages/PeerReview', () => ({
  default: () => <div>PeerReview</div>,
}));
vi.mock('@/pages/ImageReviewPage', () => ({
  default: () => <div>ImageReviewPage</div>,
}));
vi.mock('@/pages/AudioReviewPage', () => ({
  default: () => <div>AudioReviewPage</div>,
}));
vi.mock('@/pages/VideoReviewPage', () => ({
  default: () => <div>VideoReviewPage</div>,
}));
vi.mock('@/pages/LoginPage', () => ({
  default: () => <div>LoginPage</div>,
}));
vi.mock('@/pages/UploadPage', () => ({
  default: () => <div>UploadPage</div>,
}));
vi.mock('@/components/RequireAuth', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/Layout', () => ({ default: () => <div>Layout</div> }));

import App from '../../src/App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
  });

  it('renders the toaster component', () => {
    render(<App />);
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('renders the sonner component with top-center position', () => {
    render(<App />);
    const sonner = screen.getByTestId('sonner');
    expect(sonner).toBeInTheDocument();
    expect(sonner).toHaveAttribute('data-position', 'top-center');
  });

  it('renders the auth provider', () => {
    render(<App />);
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });
});
