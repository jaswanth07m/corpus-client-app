import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock BottomNav so Layout doesn't need the full router context
vi.mock('../../src/components/BottomNav', () => ({
  default: () => <nav data-testid="bottom-nav" />,
}));

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet-content">Page Content</div>,
}));

import Layout from '../../src/Layout';

describe('Layout', () => {
  it('renders without crashing', () => {
    render(<Layout />);
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });

  it('renders the BottomNav', () => {
    render(<Layout />);
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('renders outlet content alongside BottomNav', () => {
    render(<Layout />);
    expect(screen.getByText('Page Content')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });
});
