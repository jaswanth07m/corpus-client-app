import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card components', () => {
  describe('Card', () => {
    it('renders children correctly', () => {
      render(<Card data-testid="card">Card Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card Content');
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm',
      );
    });

    it('applies custom className', () => {
      render(<Card data-testid="card" className="custom-card-class" />);
      expect(screen.getByTestId('card')).toHaveClass('custom-card-class');
    });

    it('forwards ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardHeader', () => {
    it('renders children correctly', () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Header Content');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('applies custom className', () => {
      render(
        <CardHeader data-testid="header" className="custom-header-class" />,
      );
      expect(screen.getByTestId('header')).toHaveClass('custom-header-class');
    });

    it('forwards ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('renders children correctly as h3', () => {
      render(<CardTitle data-testid="title">Title Content</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toBeInTheDocument();
      expect(title.tagName.toLowerCase()).toBe('h3');
      expect(title).toHaveTextContent('Title Content');
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight',
      );
    });

    it('applies custom className', () => {
      render(<CardTitle data-testid="title" className="custom-title-class" />);
      expect(screen.getByTestId('title')).toHaveClass('custom-title-class');
    });

    it('forwards ref', () => {
      // Note: CardTitle component's internal forwardRef type defines HTMLParagraphElement as the Generic but uses it on an HTMLHeadingElement.
      // React.createRef type should be checked loosely.
      const ref = React.createRef<HTMLHeadingElement>();
      // @ts-expect-error - Ignore the mismatch between HTMLParagraphElement and HTMLHeadingElement ref typing
      render(<CardTitle ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('CardDescription', () => {
    it('renders children correctly as p', () => {
      render(
        <CardDescription data-testid="description">
          Description Content
        </CardDescription>,
      );
      const description = screen.getByTestId('description');
      expect(description).toBeInTheDocument();
      expect(description.tagName.toLowerCase()).toBe('p');
      expect(description).toHaveTextContent('Description Content');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('applies custom className', () => {
      render(
        <CardDescription
          data-testid="description"
          className="custom-desc-class"
        />,
      );
      expect(screen.getByTestId('description')).toHaveClass(
        'custom-desc-class',
      );
    });

    it('forwards ref', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardDescription ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('renders children correctly', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('applies custom className', () => {
      render(
        <CardContent data-testid="content" className="custom-content-class" />,
      );
      expect(screen.getByTestId('content')).toHaveClass('custom-content-class');
    });

    it('forwards ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('renders children correctly', () => {
      render(<CardFooter data-testid="footer">Footer Content</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('Footer Content');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('applies custom className', () => {
      render(
        <CardFooter data-testid="footer" className="custom-footer-class" />,
      );
      expect(screen.getByTestId('footer')).toHaveClass('custom-footer-class');
    });

    it('forwards ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
