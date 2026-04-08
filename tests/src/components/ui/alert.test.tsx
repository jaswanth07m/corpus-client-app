import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert', () => {
  it('renders default alert correctly', () => {
    render(<Alert data-testid="alert">Alert Content</Alert>);
    const alert = screen.getByTestId('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('Alert Content');
    // Default variant class checks
    expect(alert).toHaveClass('bg-background');
    expect(alert).toHaveClass('text-foreground');
  });

  it('renders destructive variant correctly', () => {
    render(
      <Alert variant="destructive" data-testid="alert-destructive">
        Error Alert
      </Alert>,
    );
    const alert = screen.getByTestId('alert-destructive');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('border-destructive/50');
    expect(alert).toHaveClass('text-destructive');
  });

  it('applies custom className to Alert component', () => {
    render(
      <Alert data-testid="alert-custom" className="my-custom-class">
        Custom Class Alert
      </Alert>,
    );
    const alert = screen.getByTestId('alert-custom');
    expect(alert).toHaveClass('my-custom-class');
  });

  it('forwards ref to the Alert element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Ref Content</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute('role')).toBe('alert');
  });
});

describe('AlertTitle', () => {
  it('renders alert title correctly', () => {
    render(<AlertTitle data-testid="alert-title">Warning</AlertTitle>);
    const title = screen.getByTestId('alert-title');
    expect(title).toBeInTheDocument();
    expect(title.tagName.toLowerCase()).toBe('h5');
    expect(title).toHaveTextContent('Warning');
    expect(title).toHaveClass(
      'mb-1',
      'font-medium',
      'leading-none',
      'tracking-tight',
    );
  });

  it('applies custom className to AlertTitle component', () => {
    render(
      <AlertTitle
        data-testid="alert-title-custom"
        className="custom-title-class"
      >
        Custom Title
      </AlertTitle>,
    );
    const title = screen.getByTestId('alert-title-custom');
    expect(title).toHaveClass('custom-title-class');
  });

  it('forwards ref to the AlertTitle element', () => {
    const ref = React.createRef<HTMLHeadingElement>();
    render(<AlertTitle ref={ref}>Title Ref</AlertTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(ref.current?.tagName.toLowerCase()).toBe('h5');
  });
});

describe('AlertDescription', () => {
  it('renders alert description correctly', () => {
    render(
      <AlertDescription data-testid="alert-desc">
        Description text
      </AlertDescription>,
    );
    const desc = screen.getByTestId('alert-desc');
    expect(desc).toBeInTheDocument();
    expect(desc.tagName.toLowerCase()).toBe('div');
    expect(desc).toHaveTextContent('Description text');
    expect(desc).toHaveClass('text-sm');
  });

  it('applies custom className to AlertDescription component', () => {
    render(
      <AlertDescription
        data-testid="alert-desc-custom"
        className="custom-desc-class"
      >
        Custom Desc
      </AlertDescription>,
    );
    const desc = screen.getByTestId('alert-desc-custom');
    expect(desc).toHaveClass('custom-desc-class');
  });

  it('forwards ref to the AlertDescription element', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<AlertDescription ref={ref}>Desc Ref</AlertDescription>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
