import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the useToast hook used by Toaster
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toasts: [],
  })),
}));

import { Toaster } from '../../../../src/components/ui/toaster';
import { useToast } from '../../../../src/hooks/use-toast';

describe('Toaster', () => {
  it('renders without crashing when there are no toasts', () => {
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({ toasts: [] });
    const { container } = render(<Toaster />);
    expect(container).toBeTruthy();
  });

  it('renders a toast when toasts array has one item', () => {
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Hello World',
          description: 'Test description',
          open: true,
        },
      ],
    });
    render(<Toaster />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      toasts: [
        { id: '1', title: 'Toast 1', open: true },
        { id: '2', title: 'Toast 2', open: true },
      ],
    });
    render(<Toaster />);
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('renders a toast without description when description is absent', () => {
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      toasts: [{ id: '1', title: 'No Desc Toast', open: true }],
    });
    render(<Toaster />);
    expect(screen.getByText('No Desc Toast')).toBeInTheDocument();
  });

  it('renders a toast without title when title is absent', () => {
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      toasts: [{ id: '1', description: 'Only description here', open: true }],
    });
    render(<Toaster />);
    expect(screen.getByText('Only description here')).toBeInTheDocument();
  });

  it('renders an action element when provided', () => {
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'With Action',
          action: <button>Undo</button>,
          open: true,
        },
      ],
    });
    render(<Toaster />);
    expect(screen.getByText('With Action')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });
});
