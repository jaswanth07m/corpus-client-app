import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button, buttonVariants } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    // Since buttonVariants uses cva, it should have some default classes
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('h-10');
  });

  it('renders with variants', () => {
    const { rerender } = render(
      <Button variant="destructive">Destructive</Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-input');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toHaveClass('underline-offset-4');
  });

  it('renders with sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');
    expect(screen.getByRole('button')).toHaveClass('w-10');
  });

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeInTheDocument();
    expect(link.tagName.toLowerCase()).toBe('a');
    expect(link).toHaveAttribute('href', '/test');
    // ensure standard button class applied to the anchor
    expect(link).toHaveClass('inline-flex');
  });

  it('handles custom className without overriding base classes completely', () => {
    render(<Button className="my-custom-class">Custom Class</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('my-custom-class');
    expect(button).toHaveClass('inline-flex');
  });

  it('forwards refs correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe('Ref Button');
  });

  it('passes standard HTML attributes properly', () => {
    const handleClick = vi.fn();
    render(
      <Button
        onClick={handleClick}
        disabled
        type="submit"
        aria-label="Submit Button"
      >
        Submit
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('aria-label', 'Submit Button');

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('calls onClick when not disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('buttonVariants', () => {
  it('returns default variant classes when called with no arguments', () => {
    const className = buttonVariants();
    expect(className).toContain('bg-primary');
    expect(className).toContain('h-10');
    expect(className).toContain('inline-flex');
  });

  it('returns combined classes when given arguments', () => {
    const className = buttonVariants({
      variant: 'destructive',
      size: 'sm',
      className: 'extra-class',
    });
    expect(className).toContain('bg-destructive');
    expect(className).toContain('h-9');
    expect(className).toContain('extra-class');
  });
});
