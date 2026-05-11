import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '../../../../src/components/ui/hover-card';

// Mock ResizeObserver for Radix UI
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

if (!global.ResizeObserver) {
  global.ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
}

// Mock PointerEvent if necessary for jsdom
if (!global.PointerEvent) {
  class PointerEventMock extends Event {
    pointerId = 1;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      if (params.pointerId) {
        this.pointerId = params.pointerId;
      }
    }
  }
  global.PointerEvent = PointerEventMock as unknown as typeof PointerEvent;
}

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = vi.fn();
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = vi.fn();
}

describe('HoverCard', () => {
  it('renders trigger correctly', () => {
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Some content</HoverCardContent>
      </HoverCard>,
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows content when hovered', async () => {
    const user = userEvent.setup();
    render(
      <HoverCard openDelay={0}>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Some content</HoverCardContent>
      </HoverCard>,
    );

    expect(screen.queryByText('Some content')).not.toBeInTheDocument();

    await user.hover(screen.getByText('Hover me'));

    await waitFor(() => {
      expect(screen.getByText('Some content')).toBeInTheDocument();
    });
  });

  it('can be controlled via open prop', () => {
    render(
      <HoverCard open={true}>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Some content</HoverCardContent>
      </HoverCard>,
    );

    expect(screen.getByText('Some content')).toBeInTheDocument();
  });

  it('applies custom className to HoverCardContent', () => {
    render(
      <HoverCard open={true}>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent className="custom-test-class">
          Some content
        </HoverCardContent>
      </HoverCard>,
    );

    const content = screen.getByText('Some content');
    expect(content).toHaveClass('custom-test-class');
  });

  it('handles align and sideOffset props', () => {
    render(
      <HoverCard open={true}>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent align="start" sideOffset={10}>
          Some content
        </HoverCardContent>
      </HoverCard>,
    );

    const content = screen.getByText('Some content');
    expect(content).toBeInTheDocument();
  });

  it('forwards ref to HoverCardContent', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <HoverCard open={true}>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent ref={ref}>Some content</HoverCardContent>
      </HoverCard>,
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current?.textContent).toBe('Some content');
  });
});
