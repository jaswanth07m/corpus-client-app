import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from '@/components/ui/separator';

describe('Separator', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Separator decorative={false} />);
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('renders with default horizontal orientation', () => {
      render(<Separator decorative={false} />);
      const separator = screen.getByRole('separator');
      expect(separator).toHaveClass('h-[1px]', 'w-full');
    });

    it('renders the correct element type', () => {
      render(<Separator decorative={false} />);
      const separator = screen.getByRole('separator');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('Orientation', () => {
    it('renders horizontal separator with correct classes', () => {
      render(<Separator orientation="horizontal" decorative={false} />);
      const separator = screen.getByRole('separator');
      expect(separator).toHaveClass('h-[1px]', 'w-full');
      expect(separator).not.toHaveClass('h-full', 'w-[1px]');
    });

    it('renders vertical separator with correct classes', () => {
      render(<Separator orientation="vertical" decorative={false} />);
      const separator = screen.getByRole('separator');
      expect(separator).toHaveClass('h-full', 'w-[1px]');
      expect(separator).not.toHaveClass('h-[1px]', 'w-full');
    });

    it('sets data-orientation attribute based on orientation', () => {
      const { rerender } = render(
        <Separator orientation="horizontal" decorative={false} />,
      );
      expect(screen.getByRole('separator')).toHaveAttribute(
        'data-orientation',
        'horizontal',
      );

      rerender(<Separator orientation="vertical" decorative={false} />);
      expect(screen.getByRole('separator')).toHaveAttribute(
        'data-orientation',
        'vertical',
      );
    });
  });

  describe('Styling / Props', () => {
    it('applies custom className correctly', () => {
      render(
        <Separator className="custom-class another-class" decorative={false} />,
      );
      const separator = screen.getByRole('separator');
      expect(separator).toHaveClass('custom-class', 'another-class');
      expect(separator).toHaveClass('shrink-0', 'bg-border');
    });

    it('merges custom className with default classes', () => {
      render(<Separator className="my-4" decorative={false} />);
      const separator = screen.getByRole('separator');
      expect(separator).toHaveClass('shrink-0', 'bg-border', 'my-4');
    });

    it('passes additional props to the DOM element', () => {
      render(
        <Separator
          data-testid="test-separator"
          id="my-separator"
          decorative={false}
        />,
      );
      const separator = screen.getByTestId('test-separator');
      expect(separator).toHaveAttribute('id', 'my-separator');
    });
  });

  describe('Accessibility', () => {
    it('has the correct role attribute when non-decorative', () => {
      render(<Separator decorative={false} />);
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('has data-orientation attribute', () => {
      render(<Separator decorative={false} />);
      expect(screen.getByRole('separator')).toHaveAttribute(
        'data-orientation',
        'horizontal',
      );
    });

    it('has role="none" when decorative (default)', () => {
      render(<Separator />);
      // When decorative=true (default), the role is "none" for presentational separators
      const container = document.querySelector('[role="none"]');
      expect(container).toBeInTheDocument();
    });

    it('handles decorative prop correctly', () => {
      const { rerender } = render(<Separator decorative={true} />);
      // When decorative=true, aria-label should not be present and role is "none"
      expect(document.querySelector('[role="none"]')).toBeInTheDocument();

      rerender(<Separator decorative={false} />);
      // When decorative=false, the element should have role="separator"
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });
  });

  describe('Conditional Behavior', () => {
    it('renders with decorative=true by default', () => {
      render(<Separator />);
      // Default decorative=true means role="none"
      expect(document.querySelector('[role="none"]')).toBeInTheDocument();
    });

    it('renders with decorative=false when specified', () => {
      render(<Separator decorative={false} />);
      const separator = screen.getByRole('separator');
      expect(separator).toBeInTheDocument();
    });

    it('applies base classes regardless of props', () => {
      const { rerender } = render(<Separator decorative={false} />);
      expect(screen.getByRole('separator')).toHaveClass(
        'shrink-0',
        'bg-border',
      );

      rerender(<Separator orientation="vertical" decorative={false} />);
      expect(screen.getByRole('separator')).toHaveClass(
        'shrink-0',
        'bg-border',
      );

      rerender(<Separator className="custom" decorative={false} />);
      expect(screen.getByRole('separator')).toHaveClass(
        'shrink-0',
        'bg-border',
      );
    });

    it('renders with data-orientation attribute', () => {
      render(<Separator decorative={false} />);
      expect(screen.getByRole('separator')).toHaveAttribute(
        'data-orientation',
        'horizontal',
      );
    });
  });

  describe('Edge Cases', () => {
    it('renders with no props', () => {
      render(<Separator />);
      // With default props (decorative=true), it renders with role="none"
      expect(document.querySelector('[role="none"]')).toBeInTheDocument();
    });

    it('renders multiple times without issues', () => {
      render(
        <>
          <Separator data-testid="sep-1" decorative={false} />
          <Separator
            orientation="vertical"
            data-testid="sep-2"
            decorative={false}
          />
          <Separator
            className="custom"
            data-testid="sep-3"
            decorative={false}
          />
        </>,
      );
      expect(screen.getByTestId('sep-1')).toBeInTheDocument();
      expect(screen.getByTestId('sep-2')).toBeInTheDocument();
      expect(screen.getByTestId('sep-3')).toBeInTheDocument();
    });

    it('handles empty string className', () => {
      render(<Separator className="" decorative={false} />);
      const separator = screen.getByRole('separator');
      expect(separator).toHaveClass('shrink-0', 'bg-border');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Separator ref={ref} decorative={false} />);
      expect(ref.current).toBeInTheDocument();
    });

    it('renders decorative separator without accessibility attributes', () => {
      render(<Separator decorative={true} />);
      const element = document.querySelector('[role="none"]');
      expect(element).not.toHaveAttribute('aria-label');
    });
  });
});
