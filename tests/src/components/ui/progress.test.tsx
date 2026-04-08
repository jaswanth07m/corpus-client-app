import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Progress } from '../../../../src/components/ui/progress';

describe('Progress', () => {
  it('renders progress bar with default classes', () => {
    render(<Progress value={50} />);

    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveClass(
      'relative',
      'h-4',
      'w-full',
      'overflow-hidden',
      'rounded-full',
      'bg-secondary',
    );
  });

  it('applies custom className', () => {
    render(<Progress value={50} className="custom-progress" />);

    expect(screen.getByRole('progressbar')).toHaveClass('custom-progress');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Progress value={50} ref={ref} />);

    expect(ref).toHaveBeenCalled();
  });

  it('passes through HTML attributes', () => {
    render(
      <Progress
        value={50}
        data-testid="test-progress"
        aria-label="Loading progress"
      />,
    );

    expect(screen.getByTestId('test-progress')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Loading progress',
    );
  });

  it('handles undefined value (defaults to 0 indicator style)', () => {
    const { container } = render(<Progress />);

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('handles null value (defaults to 0 indicator style)', () => {
    const { container } = render(
      <Progress value={null as unknown as undefined} />,
    );

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('renders indicator with correct transform style for value 50', () => {
    const { container } = render(<Progress value={50} />);

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle('transform: translateX(-50%)');
  });

  it('renders indicator with correct transform style for value 0', () => {
    const { container } = render(<Progress value={0} />);

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('renders indicator with correct transform style for value 100', () => {
    const { container } = render(<Progress value={100} />);

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toHaveStyle('transform: translateX(-0%)');
  });

  it('renders indicator with correct transform style for value 25', () => {
    const { container } = render(<Progress value={25} />);

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toHaveStyle('transform: translateX(-75%)');
  });

  it('renders indicator with correct transform style for value 75', () => {
    const { container } = render(<Progress value={75} />);

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toHaveStyle('transform: translateX(-25%)');
  });

  it('indicator has correct base classes', () => {
    const { container } = render(<Progress value={50} />);

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toHaveClass(
      'h-full',
      'w-full',
      'flex-1',
      'bg-primary',
      'transition-all',
    );
  });

  it('handles decimal values', () => {
    const { container } = render(<Progress value={33.33} />);

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toHaveStyle('transform: translateX(-66.67%)');
  });

  it('handles max aria attribute', () => {
    render(<Progress value={50} max={200} />);

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemax', '200');
  });

  it('maintains default min aria attribute', () => {
    render(<Progress value={50} />);

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
  });

  it('renders without value prop', () => {
    const { container } = render(<Progress />);

    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();

    const indicator = container.querySelector('[style*="transform"]');
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('applies multiple custom classes', () => {
    render(<Progress value={50} className="class1 class2 class3" />);

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveClass('class1');
    expect(progress).toHaveClass('class2');
    expect(progress).toHaveClass('class3');
  });

  it('maintains default classes with custom className', () => {
    render(<Progress value={50} className="custom" />);

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveClass('relative', 'h-4', 'w-full');
    expect(progress).toHaveClass('custom');
  });

  it('passes additional props to root element', () => {
    render(<Progress value={50} id="progress-1" title="Upload progress" />);

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('id', 'progress-1');
    expect(progress).toHaveAttribute('title', 'Upload progress');
  });

  it('renders with data attributes', () => {
    render(
      <Progress
        value={50}
        data-state="loading"
        data-test-id="progress-component"
      />,
    );

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('data-state', 'loading');
    expect(progress).toHaveAttribute('data-test-id', 'progress-component');
  });
});
