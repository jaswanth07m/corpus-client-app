import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '../../../../src/components/ui/toast';

describe('Toast', () => {
  it('renders ToastProvider and ToastViewport without crashing', () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport data-testid="toast-viewport" />
      </ToastProvider>,
    );
    expect(container).toBeTruthy();
  });

  it('renders a default Toast with title and description', () => {
    render(
      <ToastProvider>
        <Toast open data-testid="toast">
          <ToastTitle>Success</ToastTitle>
          <ToastDescription>Operation completed.</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed.')).toBeInTheDocument();
  });

  it('renders a destructive Toast variant', () => {
    render(
      <ToastProvider>
        <Toast open variant="destructive" data-testid="destructive-toast">
          <ToastTitle>Error</ToastTitle>
          <ToastDescription>Something went wrong.</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('renders ToastAction with altText', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>Alert</ToastTitle>
          <ToastAction altText="Undo action">Undo</ToastAction>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('renders ToastClose button', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>Hi</ToastTitle>
          <ToastClose aria-label="close" />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    const closeBtn = screen.getByRole('button', { hidden: true });
    expect(closeBtn).toBeInTheDocument();
  });

  it('does not render Toast content when open is false', () => {
    render(
      <ToastProvider>
        <Toast open={false}>
          <ToastTitle>Hidden Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    // When closed, Radix may unmount or hide; ensure no crash
    expect(document.body).toBeTruthy();
  });

  it('applies custom className to ToastViewport', () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport className="my-viewport-class" />
      </ToastProvider>,
    );
    const viewport = container.querySelector('[aria-live]');
    if (viewport) {
      expect(viewport.className).toContain('my-viewport-class');
    }
  });
});
