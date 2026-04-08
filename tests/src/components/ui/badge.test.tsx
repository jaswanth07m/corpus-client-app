import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from '@/components/ui/badge';

describe('Badge', () => {
  describe('badgeVariants function', () => {
    it('should return base classes for default variant', () => {
      const result = badgeVariants({ variant: 'default' });
      expect(result).toContain('inline-flex');
      expect(result).toContain('items-center');
      expect(result).toContain('rounded-full');
      expect(result).toContain('border');
      expect(result).toContain('px-2.5');
      expect(result).toContain('py-0.5');
      expect(result).toContain('text-xs');
      expect(result).toContain('font-semibold');
      expect(result).toContain('transition-colors');
      expect(result).toContain('focus:outline-none');
      expect(result).toContain('focus:ring-2');
      expect(result).toContain('focus:ring-ring');
      expect(result).toContain('focus:ring-offset-2');
      expect(result).toContain('border-transparent');
      expect(result).toContain('bg-primary');
      expect(result).toContain('text-primary-foreground');
      expect(result).toContain('hover:bg-primary/80');
    });

    it('should return base classes for secondary variant', () => {
      const result = badgeVariants({ variant: 'secondary' });
      expect(result).toContain('border-transparent');
      expect(result).toContain('bg-secondary');
      expect(result).toContain('text-secondary-foreground');
      expect(result).toContain('hover:bg-secondary/80');
    });

    it('should return base classes for destructive variant', () => {
      const result = badgeVariants({ variant: 'destructive' });
      expect(result).toContain('border-transparent');
      expect(result).toContain('bg-destructive');
      expect(result).toContain('text-destructive-foreground');
      expect(result).toContain('hover:bg-destructive/80');
    });

    it('should return base classes for outline variant', () => {
      const result = badgeVariants({ variant: 'outline' });
      expect(result).toContain('text-foreground');
      expect(result).not.toContain('border-transparent');
      expect(result).not.toContain('bg-primary');
    });

    it('should return default variant classes when no variant is provided', () => {
      const result = badgeVariants({});
      expect(result).toContain('bg-primary');
      expect(result).toContain('text-primary-foreground');
    });

    it('should return default variant classes when variant is undefined', () => {
      const result = badgeVariants({ variant: undefined });
      expect(result).toContain('bg-primary');
      expect(result).toContain('text-primary-foreground');
    });
  });

  describe('Badge component rendering', () => {
    it('should render with default variant', () => {
      render(<Badge>Test Badge</Badge>);
      const badge = screen.getByText('Test Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-primary');
      expect(badge).toHaveClass('text-primary-foreground');
    });

    it('should render with default variant explicitly', () => {
      render(<Badge variant="default">Default Badge</Badge>);
      const badge = screen.getByText('Default Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-primary');
      expect(badge).toHaveClass('text-primary-foreground');
      expect(badge).toHaveClass('hover:bg-primary/80');
    });

    it('should render with secondary variant', () => {
      render(<Badge variant="secondary">Secondary Badge</Badge>);
      const badge = screen.getByText('Secondary Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('text-secondary-foreground');
      expect(badge).toHaveClass('hover:bg-secondary/80');
    });

    it('should render with destructive variant', () => {
      render(<Badge variant="destructive">Destructive Badge</Badge>);
      const badge = screen.getByText('Destructive Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-destructive');
      expect(badge).toHaveClass('text-destructive-foreground');
      expect(badge).toHaveClass('hover:bg-destructive/80');
    });

    it('should render with outline variant', () => {
      render(<Badge variant="outline">Outline Badge</Badge>);
      const badge = screen.getByText('Outline Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-foreground');
      expect(badge).not.toHaveClass('border-transparent');
    });
  });

  describe('Badge component with custom className', () => {
    it('should merge custom className with base classes', () => {
      render(
        <Badge className="custom-class another-class">Custom Badge</Badge>,
      );
      const badge = screen.getByText('Custom Badge');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('another-class');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('bg-primary');
    });

    it('should allow className override for specific styles', () => {
      render(<Badge className="bg-custom-override">Override Badge</Badge>);
      const badge = screen.getByText('Override Badge');
      expect(badge).toHaveClass('bg-custom-override');
    });

    it('should handle empty className', () => {
      render(<Badge className="">Empty Class Badge</Badge>);
      const badge = screen.getByText('Empty Class Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('inline-flex');
    });
  });

  describe('Badge component with HTML attributes', () => {
    it('should forward data attributes', () => {
      render(
        <Badge data-testid="badge-test" data-custom="custom-value">
          Data Attr Badge
        </Badge>,
      );
      const badge = screen.getByTestId('badge-test');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-custom', 'custom-value');
    });

    it('should forward aria attributes', () => {
      render(<Badge aria-label="Badge label">Aria Badge</Badge>);
      const badge = screen.getByText('Aria Badge');
      expect(badge).toHaveAttribute('aria-label', 'Badge label');
    });

    it('should forward id attribute', () => {
      render(<Badge id="badge-id">ID Badge</Badge>);
      const badge = screen.getByText('ID Badge');
      expect(badge).toHaveAttribute('id', 'badge-id');
    });

    it('should forward role attribute', () => {
      render(<Badge role="status">Role Badge</Badge>);
      const badge = screen.getByText('Role Badge');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should forward multiple HTML attributes', () => {
      render(
        <Badge
          id="multi-attr"
          data-test="test-value"
          aria-describedby="description"
          title="Badge title"
        >
          Multi Attr Badge
        </Badge>,
      );
      const badge = screen.getByText('Multi Attr Badge');
      expect(badge).toHaveAttribute('id', 'multi-attr');
      expect(badge).toHaveAttribute('data-test', 'test-value');
      expect(badge).toHaveAttribute('aria-describedby', 'description');
      expect(badge).toHaveAttribute('title', 'Badge title');
    });
  });

  describe('Badge component with children', () => {
    it('should render text children', () => {
      render(<Badge>Simple Text</Badge>);
      expect(screen.getByText('Simple Text')).toBeInTheDocument();
    });

    it('should render JSX children', () => {
      render(
        <Badge>
          <span>Nested Span</span>
        </Badge>,
      );
      expect(screen.getByText('Nested Span')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <Badge>
          <span>First</span>
          <span>Second</span>
        </Badge>,
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('should render numeric children', () => {
      render(<Badge>{42}</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render mixed children', () => {
      const { container } = render(
        <Badge>
          Text <strong>Bold</strong> and more text
        </Badge>,
      );
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(container.textContent).toContain('Text');
      expect(container.textContent).toContain('and more text');
    });
  });

  describe('Badge component variants combination', () => {
    it('should apply correct classes for each variant', () => {
      const { rerender } = render(<Badge variant="default">Default</Badge>);
      expect(screen.getByText('Default')).toHaveClass('bg-primary');

      rerender(<Badge variant="secondary">Secondary</Badge>);
      expect(screen.getByText('Secondary')).toHaveClass('bg-secondary');

      rerender(<Badge variant="destructive">Destructive</Badge>);
      expect(screen.getByText('Destructive')).toHaveClass('bg-destructive');

      rerender(<Badge variant="outline">Outline</Badge>);
      expect(screen.getByText('Outline')).toHaveClass('text-foreground');
      expect(screen.getByText('Outline')).not.toHaveClass('border-transparent');
    });
  });

  describe('Badge component base classes', () => {
    it('should always have base structure classes', () => {
      const { rerender } = render(<Badge>Test 1</Badge>);
      let badge = screen.getByText('Test 1');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('border');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-semibold');

      rerender(<Badge variant="secondary">Test 2</Badge>);
      badge = screen.getByText('Test 2');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-full');

      rerender(<Badge variant="outline">Test 3</Badge>);
      badge = screen.getByText('Test 3');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('rounded-full');
    });
  });
});
