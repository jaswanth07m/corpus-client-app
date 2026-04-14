import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Toggle } from '../../../../src/components/ui/toggle';

describe('Toggle', () => {
  it('renders without crashing', () => {
    render(<Toggle aria-label="Bold">B</Toggle>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<Toggle>Bold</Toggle>);
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Toggle data-testid="toggle">Default</Toggle>);
    const toggle = screen.getByTestId('toggle');
    expect(toggle.className).toContain('bg-transparent');
  });

  it('applies outline variant classes', () => {
    render(
      <Toggle variant="outline" data-testid="toggle">
        Outline
      </Toggle>,
    );
    const toggle = screen.getByTestId('toggle');
    expect(toggle.className).toContain('border');
  });

  it('applies sm size classes', () => {
    render(
      <Toggle size="sm" data-testid="toggle">
        Small
      </Toggle>,
    );
    const toggle = screen.getByTestId('toggle');
    expect(toggle.className).toContain('h-9');
  });

  it('applies lg size classes', () => {
    render(
      <Toggle size="lg" data-testid="toggle">
        Large
      </Toggle>,
    );
    const toggle = screen.getByTestId('toggle');
    expect(toggle.className).toContain('h-11');
  });

  it('can be disabled', () => {
    render(
      <Toggle disabled data-testid="toggle">
        Disabled
      </Toggle>,
    );
    const toggle = screen.getByTestId('toggle');
    expect(toggle).toBeDisabled();
  });

  it('responds to click and toggles pressed state', () => {
    render(<Toggle data-testid="toggle">Click</Toggle>);
    const toggle = screen.getByTestId('toggle');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('data-state', 'on');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('data-state', 'off');
  });

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(
      <Toggle onClick={onClick} data-testid="toggle">
        Click
      </Toggle>,
    );
    fireEvent.click(screen.getByTestId('toggle'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports controlled pressed state', () => {
    render(
      <Toggle pressed data-testid="toggle">
        Pressed
      </Toggle>,
    );
    expect(screen.getByTestId('toggle')).toHaveAttribute('data-state', 'on');
  });
});
