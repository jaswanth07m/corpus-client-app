import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotFound from '@/pages/NotFound';

const { mockUseLocation, mockUseTranslation } = vi.hoisted(() => ({
  mockUseLocation: vi.fn(),
  mockUseTranslation: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );

  return {
    ...actual,
    useLocation: mockUseLocation,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('NotFound', () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: '/missing-route',
    });
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders the 404 page content', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', {
        name: '404',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('common.oopsPageNotFound')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'nav.returnToHome' }),
    ).toHaveAttribute('href', '/');
  });

  it('logs the missing route path', () => {
    render(<NotFound />);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      '/missing-route',
    );
  });
});
