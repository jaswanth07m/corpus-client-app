import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

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

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = vi.fn();
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = vi.fn();
}

describe('Popover Components', () => {
  it('renders PopoverTrigger correctly', () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );

    expect(screen.getByText('Open Popover')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows PopoverContent when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Content inside</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByText('Open Popover');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Content inside')).toBeInTheDocument();
    });
  });

  it('can be controlled via open prop', () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Content inside</PopoverContent>
      </Popover>,
    );

    expect(screen.getByText('Content inside')).toBeInTheDocument();
  });

  it('applies custom className to PopoverContent', () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent className="custom-test-class">
          Content inside
        </PopoverContent>
      </Popover>,
    );

    const content = screen.getByText('Content inside');
    expect(content).toHaveClass('custom-test-class');
  });

  it('handles align and sideOffset props', () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent align="start" sideOffset={10}>
          Content inside
        </PopoverContent>
      </Popover>,
    );

    const content = screen.getByText('Content inside');
    expect(content).toBeInTheDocument();
  });

  it('forwards ref to PopoverContent correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Popover open={true}>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent ref={ref}>Content inside</PopoverContent>
      </Popover>,
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current?.textContent).toBe('Content inside');
  });
});
