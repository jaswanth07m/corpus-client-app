import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AspectRatio } from '@/components/ui/aspect-ratio';

describe('AspectRatio', () => {
  it('renders children correctly', () => {
    render(
      <AspectRatio>
        <div data-testid="child">Child Content</div>
      </AspectRatio>,
    );
    const childCmp = screen.getByTestId('child');
    expect(childCmp).toBeInTheDocument();
    expect(childCmp).toHaveTextContent('Child Content');
  });

  it('renders with a custom ratio', () => {
    render(
      <AspectRatio ratio={16 / 9} data-testid="aspect-ratio">
        <div>Content</div>
      </AspectRatio>,
    );
    const aspectRatioTarget = screen.getByTestId('aspect-ratio');
    expect(aspectRatioTarget).toBeInTheDocument();
  });

  it('applies custom className to AspectRatio component', () => {
    render(
      <AspectRatio
        data-testid="aspect-ratio-custom"
        className="my-custom-class"
      >
        Content
      </AspectRatio>,
    );
    const element = screen.getByTestId('aspect-ratio-custom');
    expect(element).toHaveClass('my-custom-class');
  });

  it('forwards ref to the AspectRatio element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <AspectRatio ref={ref} data-testid="aspect-ratio-ref">
        Ref Content
      </AspectRatio>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(screen.getByTestId('aspect-ratio-ref')).toBe(ref.current);
  });
});
