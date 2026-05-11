import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

describe('Collapsible Components', () => {
  it('renders correctly', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Content</CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('toggles content visibility when clicking the trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Collapsible onOpenChange={onOpenChange}>
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Content</CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByTestId('trigger');

    // Content is initially hidden with data-state closed
    expect(screen.getByTestId('content')).toHaveAttribute(
      'data-state',
      'closed',
    );

    // Click trigger to open
    await user.click(trigger);

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toHaveTextContent('Content');
    expect(onOpenChange).toHaveBeenCalledWith(true);

    // Click trigger to close
    await user.click(trigger);

    // After clicking again, expects closed state
    expect(screen.getByTestId('content')).toHaveAttribute(
      'data-state',
      'closed',
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('starts open when defaultOpen is true', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Content</CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('respects controlled open state', () => {
    const { rerender } = render(
      <Collapsible open={false}>
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Content</CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.getByTestId('content')).toHaveAttribute(
      'data-state',
      'closed',
    );

    rerender(
      <Collapsible open={true}>
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Content</CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('handles disabled state properly and blocks click events', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Collapsible disabled onOpenChange={onOpenChange}>
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Content</CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByTestId('trigger');
    expect(trigger).toHaveAttribute('data-disabled');

    await user.click(trigger);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('content')).toHaveAttribute(
      'data-state',
      'closed',
    );
  });

  it('allows asChild prop for custom trigger components', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button data-testid="custom-trigger" className="custom-btn">
            Custom
          </button>
        </CollapsibleTrigger>
      </Collapsible>,
    );

    const customTrigger = screen.getByTestId('custom-trigger');
    expect(customTrigger).toBeInTheDocument();
    expect(customTrigger.tagName).toBe('BUTTON');
    expect(customTrigger).toHaveClass('custom-btn');
  });
});
