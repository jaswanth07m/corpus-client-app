import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '../../../../src/components/ui/skeleton';

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('renders skeleton with default classes', () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    it('renders skeleton with custom className', () => {
      const { container } = render(
        <Skeleton className="custom-class w-32 h-32" />,
      );

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
      expect(skeleton).toHaveClass('custom-class', 'w-32', 'h-32');
    });

    it('merges custom className with default classes properly', () => {
      const { container } = render(<Skeleton className="bg-primary" />);

      const skeleton = container.firstChild as HTMLDivElement;
      // tailwind-merge should handle class conflicts
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md');
      expect(skeleton.className).toMatch(/bg-(primary|muted)/);
    });
  });

  describe('HTML Attributes', () => {
    it('passes through additional HTML attributes', () => {
      const { container } = render(
        <Skeleton data-testid="skeleton-test" id="skeleton-id" />,
      );

      const skeleton = container.querySelector(
        '[data-testid="skeleton-test"]',
      ) as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('id', 'skeleton-id');
    });

    it('passes through aria attributes', () => {
      const { container } = render(
        <Skeleton aria-label="Loading content" aria-busy="true" />,
      );

      const skeleton = container.querySelector(
        '[aria-label="Loading content"]',
      ) as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('passes through style attribute', () => {
      const { container } = render(
        <Skeleton style={{ width: '200px', height: '100px' }} />,
      );

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });

    it('passes through multiple HTML attributes', () => {
      const { container } = render(
        <Skeleton
          data-testid="skeleton-test"
          data-type="loading"
          id="skeleton-id"
          title="Loading placeholder"
          role="status"
        />,
      );

      const skeleton = container.querySelector(
        '[data-testid="skeleton-test"]',
      ) as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('id', 'skeleton-id');
      expect(skeleton).toHaveAttribute('data-type', 'loading');
      expect(skeleton).toHaveAttribute('title', 'Loading placeholder');
      expect(skeleton).toHaveAttribute('role', 'status');
    });
  });

  describe('Children Content', () => {
    it('renders with children content', () => {
      const { container } = render(<Skeleton>Child content</Skeleton>);

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveTextContent('Child content');
    });

    it('renders with JSX children', () => {
      const { container } = render(
        <Skeleton>
          <span data-testid="child-span">Nested content</span>
        </Skeleton>,
      );

      const childSpan = container.querySelector(
        '[data-testid="child-span"]',
      ) as HTMLSpanElement;
      expect(childSpan).toBeInTheDocument();
    });

    it('renders with multiple children', () => {
      const { container } = render(
        <Skeleton>
          <span>First</span>
          <span>Second</span>
        </Skeleton>,
      );

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveTextContent('FirstSecond');
    });

    it('renders with null children', () => {
      const { container } = render(<Skeleton>{null}</Skeleton>);

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
    });

    it('renders with empty children', () => {
      const { container } = render(<Skeleton>{''}</Skeleton>);

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders with role attribute for accessibility', () => {
      const { container } = render(
        <Skeleton role="progressbar" aria-busy="true" />,
      );

      const skeleton = container.querySelector(
        '[role="progressbar"]',
      ) as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('can be customized with aria attributes for screen readers', () => {
      const { container } = render(
        <Skeleton
          aria-label="Loading user information"
          aria-describedby="loading-description"
        />,
      );

      const skeleton = container.querySelector(
        '[aria-label="Loading user information"]',
      ) as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute(
        'aria-describedby',
        'loading-description',
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty className', () => {
      const { container } = render(<Skeleton className="" />);

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    it('handles multiple className values as array-like string', () => {
      const { container } = render(
        <Skeleton className="class1 class2 class3" />,
      );

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('class1', 'class2', 'class3');
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    it('handles special characters in className', () => {
      const { container } = render(
        <Skeleton className="class-with-dash class_with_underscore" />,
      );

      const skeleton = container.firstChild as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('class-with-dash', 'class_with_underscore');
    });

    it('renders with all props combined', () => {
      const { container } = render(
        <Skeleton
          className="combined-class"
          data-testid="combined-test"
          aria-label="Combined test"
          style={{ opacity: 0.5 }}
        >
          Combined content
        </Skeleton>,
      );

      const skeleton = container.querySelector(
        '[data-testid="combined-test"]',
      ) as HTMLDivElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
      expect(skeleton).toHaveClass('combined-class');
      expect(skeleton).toHaveAttribute('aria-label', 'Combined test');
      expect(skeleton).toHaveStyle({ opacity: 0.5 });
      expect(skeleton).toHaveTextContent('Combined content');
    });
  });
});
