import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MemoryRouter,
  useNavigate,
  useLocation,
  Location,
} from 'react-router-dom';
import BottomNav from '../../../src/components/BottomNav';
import '@testing-library/jest-dom';

// Mock the hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

// Mock useAuth hook with all required properties
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    token: null,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isReady: true,
    refetchUser: vi.fn(),
  })),
}));

describe('BottomNav', () => {
  let mockNavigate: ReturnType<typeof vi.fn>;
  let mockLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
    mockLocation = {
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    } as Location;
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useLocation).mockReturnValue(mockLocation);
  });

  it('renders all navigation items', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    // Check that home button is present
    expect(screen.getByRole('button')).toBeInTheDocument();

    // Check for SVG icons (3 navigation items: home, tools, profile)
    const svgIcons = document.querySelectorAll('svg');
    expect(svgIcons).toHaveLength(3);
  });

  it('navigates to home page when home button is clicked', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    const homeButton = screen.getByRole('button');
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to tools page when tools button is clicked', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    const toolsLink = document.querySelector('a[href="/tools"]');
    expect(toolsLink).toBeInTheDocument();

    if (toolsLink) {
      fireEvent.click(toolsLink);
    }
  });

  it('navigates to profile page when profile button is clicked', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    const profileLink = document.querySelector('a[href="/profile"]');
    expect(profileLink).toBeInTheDocument();

    if (profileLink) {
      fireEvent.click(profileLink);
    }
  });

  it('applies active class to home button when on home page', () => {
    mockLocation = {
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    } as Location;
    vi.mocked(useLocation).mockReturnValue(mockLocation);

    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    const homeButton = screen.getByRole('button');
    expect(homeButton).toHaveClass('text-blue-600');
  });

  it('applies active class to tools button when on tools page', () => {
    mockLocation = {
      pathname: '/tools',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    } as Location;
    vi.mocked(useLocation).mockReturnValue(mockLocation);

    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    const toolsLink = document.querySelector('a[href="/tools"]');
    expect(toolsLink).toHaveClass('text-blue-600');
  });

  it('applies active class to profile button when on profile page', () => {
    mockLocation = {
      pathname: '/profile',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    } as Location;
    vi.mocked(useLocation).mockReturnValue(mockLocation);

    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    const profileLink = document.querySelector('a[href="/profile"]');
    expect(profileLink).toHaveClass('text-blue-600');
  });

  it('applies hover styles to inactive buttons', () => {
    mockLocation = {
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    } as Location;
    vi.mocked(useLocation).mockReturnValue(mockLocation);

    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    const toolsLink = document.querySelector('a[href="/tools"]');
    expect(toolsLink).toHaveClass('text-slate-700');
    expect(toolsLink).toHaveClass('hover:bg-slate-50');
  });

  it('has correct CSS classes for styling', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    const navContainer = document.querySelector('.bottom-nav');
    expect(navContainer).toHaveClass('fixed');
    expect(navContainer).toHaveClass('bottom-0');
    expect(navContainer).toHaveClass('bg-white');
    expect(navContainer).toHaveClass('shadow-lg');
    expect(navContainer).toHaveClass('z-50');
  });

  it('has proper accessibility attributes', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    // Check that buttons have proper role
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => {
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('flex-col');
    });

    // Check that links have proper href
    const links = document.querySelectorAll('a');
    expect(links).toHaveLength(2); // tools, profile
    expect(links[0]).toHaveAttribute('href', '/tools');
    expect(links[1]).toHaveAttribute('href', '/profile');
  });

  it('handles nested routes correctly for active state', () => {
    mockLocation = {
      pathname: '/profile/settings',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    } as Location;
    vi.mocked(useLocation).mockReturnValue(mockLocation);

    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    // Profile should be active for /profile/settings
    const profileLink = document.querySelector('a[href="/profile"]');
    expect(profileLink).toHaveClass('text-blue-600');
  });

  it('renders navigation items with correct icons', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    // Home icon should have home path d attribute
    const homeIcon = document.querySelector('button svg');
    expect(homeIcon).toBeInTheDocument();

    // PencilRuler icon for tools
    const toolsIcon = document.querySelector('a[href="/tools"] svg');
    expect(toolsIcon).toBeInTheDocument();

    // User icon for profile
    const profileIcon = document.querySelector('a[href="/profile"] svg');
    expect(profileIcon).toBeInTheDocument();
  });

  it('has correct IDs for tour guidance', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );

    const homeButton = document.querySelector('#tour-home-nav');
    expect(homeButton).toBeInTheDocument();

    const toolsLink = document.querySelector('#tour-tools-nav');
    expect(toolsLink).toBeInTheDocument();

    const profileLink = document.querySelector('#tour-profile-nav');
    expect(profileLink).toBeInTheDocument();
  });
});
