import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Mock ResizeObserver for Radix UI ScrollArea
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

describe('ScrollArea component', () => {
  it('renders correctly with children', () => {
    render(
      <ScrollArea data-testid="scroll-area">
        <div data-testid="content">Content</div>
      </ScrollArea>,
    );

    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea).toHaveClass('relative', 'overflow-hidden');

    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Content');
  });

  it('applies custom className to ScrollArea', () => {
    render(
      <ScrollArea className="custom-class" data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>,
    );
    expect(screen.getByTestId('scroll-area')).toHaveClass('custom-class');
  });

  it('forwards ref correctly to ScrollArea', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ScrollArea ref={ref}>
        <div>Content</div>
      </ScrollArea>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('ScrollBar component', () => {
  // Since ScrollBar is typically used inside ScrollArea, but we can test it independently
  // Note: Radix UI Scrollbar expects to be within ScrollArea context.
  // We can render it within a minimal ScrollArea or use test-ids.

  it('renders correctly in horizontal orientation', () => {
    render(
      <ScrollArea type="always">
        <ScrollBar
          orientation="horizontal"
          data-testid="horizontal-scrollbar"
        />
      </ScrollArea>,
    );

    const scrollbar = screen.getByTestId('horizontal-scrollbar');
    expect(scrollbar).toBeInTheDocument();
    expect(scrollbar).toHaveAttribute('data-orientation', 'horizontal');
    expect(scrollbar).toHaveClass('h-2.5', 'flex-col', 'border-t');
  });

  it('renders correctly in vertical orientation by default', () => {
    render(
      <ScrollArea type="always">
        <ScrollBar data-testid="vertical-scrollbar" />
      </ScrollArea>,
    );

    const scrollbar = screen.getByTestId('vertical-scrollbar');
    expect(scrollbar).toBeInTheDocument();
    expect(scrollbar).toHaveAttribute('data-orientation', 'vertical');
    expect(scrollbar).toHaveClass('h-full', 'w-2.5', 'border-l');
  });

  it('applies custom className to ScrollBar', () => {
    render(
      <ScrollArea type="always">
        <ScrollBar className="custom-scrollbar-class" data-testid="scrollbar" />
      </ScrollArea>,
    );
    expect(screen.getByTestId('scrollbar')).toHaveClass(
      'custom-scrollbar-class',
    );
  });

  it('forwards ref correctly to ScrollBar', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ScrollArea type="always">
        <ScrollBar ref={ref} />
      </ScrollArea>,
    );
    // Since we are using standard DOM elements even when Radix primitives are involved
    expect(ref.current).not.toBeNull();
  });
});
