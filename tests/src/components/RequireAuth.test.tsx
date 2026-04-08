import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RequireAuth from '../../../src/components/RequireAuth';

const mockUseAuth = vi.fn();
const mockUseLocation = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', () => ({
  Navigate: (props: unknown) => {
    mockNavigate(props);
    return <div data-testid="navigate-marker">redirecting</div>;
  },
  useLocation: () => mockUseLocation(),
}));

describe('RequireAuth', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseLocation.mockReset();
    mockNavigate.mockReset();

    mockUseLocation.mockReturnValue({
      pathname: '/dashboard',
      search: '?tab=points',
      hash: '#summary',
      state: { source: 'test' },
      key: 'location-key',
    });
  });

  it('renders a translated loading state while auth is not ready', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      isReady: false,
    });

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>,
    );

    expect(screen.getByText('messages.loading')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to login with replace and the current location in state', () => {
    const location = {
      pathname: '/dashboard',
      search: '?tab=points',
      hash: '#summary',
      state: { source: 'test' },
      key: 'location-key',
    };

    mockUseLocation.mockReturnValue(location);
    mockUseAuth.mockReturnValue({
      token: null,
      isReady: true,
    });

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>,
    );

    expect(screen.getByTestId('navigate-marker')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/login',
      replace: true,
      state: { from: location },
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users without redirecting', () => {
    mockUseAuth.mockReturnValue({
      token: 'valid-token',
      isReady: true,
    });

    render(
      <RequireAuth>
        <section>
          <h1>Protected Content</h1>
          <p>Visible only to authenticated users</p>
        </section>
      </RequireAuth>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(
      screen.getByText('Visible only to authenticated users'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-marker')).not.toBeInTheDocument();
    expect(screen.queryByText('messages.loading')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
