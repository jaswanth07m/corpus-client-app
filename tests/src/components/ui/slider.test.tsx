import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Slider } from '../../../../src/components/ui/slider';

describe('Slider', () => {
  describe('Rendering', () => {
    it('renders slider with default classes', () => {
      const { container } = render(<Slider />);

      const slider = container.querySelector('[role="slider"]');
      expect(slider).toBeInTheDocument();

      // Check root element has default classes
      const root = container.firstChild as HTMLDivElement;
      expect(root).toHaveClass('relative', 'flex', 'w-full');
      expect(root).toHaveClass('touch-none', 'select-none', 'items-center');
    });

    it('renders slider with custom className', () => {
      const { container } = render(<Slider className="custom-class h-64" />);

      const root = container.firstChild as HTMLDivElement;
      expect(root).toHaveClass('custom-class', 'h-64');
      expect(root).toHaveClass('relative');
      expect(root).toHaveClass('flex');
      expect(root).toHaveClass('w-full');
      expect(root).toHaveClass('touch-none', 'select-none', 'items-center');
    });

    it('merges custom className with default classes properly', () => {
      const { container } = render(<Slider className="flex-col" />);

      const root = container.firstChild as HTMLDivElement;
      expect(root).toHaveClass('flex-col');
      expect(root).toHaveClass('relative', 'w-full', 'touch-none');
      expect(root).toHaveClass('select-none', 'items-center');
    });
  });

  describe('Value Props', () => {
    it('renders with single value', () => {
      const { container } = render(<Slider value={[50]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider).toBeInTheDocument();
      expect(slider.getAttribute('aria-valuenow')).toBe('50');
    });

    it('renders with range values array', () => {
      const { container } = render(<Slider value={[25, 75]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider).toBeInTheDocument();
      // First value in the array is used for the primary thumb
      expect(slider.getAttribute('aria-valuenow')).toBe('25');
    });

    it('renders with min value', () => {
      const { container } = render(<Slider min={0} max={100} value={[10]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider.getAttribute('aria-valuemin')).toBe('0');
      expect(slider.getAttribute('aria-valuemax')).toBe('100');
    });

    it('renders with max value', () => {
      const { container } = render(<Slider max={200} value={[100]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider.getAttribute('aria-valuemax')).toBe('200');
    });

    it('renders with step value', () => {
      const { container } = render(<Slider step={5} value={[50]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider.getAttribute('aria-valuenow')).toBe('50');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled slider', () => {
      const { container } = render(<Slider disabled />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider).toHaveAttribute('data-disabled');
    });

    it('applies disabled pointer events', () => {
      const { container } = render(<Slider disabled value={[50]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      // Disabled slider should have pointer-events none via class
      expect(slider).toHaveAttribute('data-disabled');
    });
  });

  describe('Orientation', () => {
    it('renders horizontal slider (default)', () => {
      const { container } = render(<Slider orientation="horizontal" />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('renders vertical slider', () => {
      const { container } = render(<Slider orientation="vertical" />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider.getAttribute('aria-orientation')).toBe('vertical');
    });
  });

  describe('Event Handlers', () => {
    it('accepts onValueChange prop', () => {
      const onValueChange = vi.fn();
      render(<Slider value={[50]} onValueChange={onValueChange} />);

      // Verify the component renders with the handler
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('accepts onValueCommit prop', () => {
      const onValueCommit = vi.fn();
      render(<Slider value={[50]} onValueCommit={onValueCommit} />);

      // Verify the component renders with the handler
      expect(onValueCommit).not.toHaveBeenCalled();
    });

    it('accepts onPointerDown and onPointerUp props', () => {
      const onPointerDown = vi.fn();
      const onPointerUp = vi.fn();
      render(
        <Slider
          value={[50]}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        />,
      );

      expect(onPointerDown).not.toHaveBeenCalled();
      expect(onPointerUp).not.toHaveBeenCalled();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to the SliderPrimitive.Root element', () => {
      const ref = { current: null as HTMLElement | null };
      render(<Slider ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it('forwards ref with custom className', () => {
      const ref = { current: null as HTMLElement | null };
      render(<Slider ref={ref} className="ref-test-class" />);

      expect(ref.current).toBeInstanceOf(HTMLElement);
      expect(ref.current).toHaveClass('ref-test-class');
    });
  });

  describe('Track and Range', () => {
    it('renders track element', () => {
      const { container } = render(<Slider />);

      // Track is a span with specific classes inside the root
      const root = container.firstChild as HTMLDivElement;
      const track = root.querySelector('span');
      expect(track).toBeInTheDocument();
      expect(track).toHaveClass('relative', 'h-2', 'w-full', 'grow');
      expect(track).toHaveClass(
        'overflow-hidden',
        'rounded-full',
        'bg-secondary',
      );
    });

    it('renders range element inside track', () => {
      const { container } = render(<Slider value={[50]} />);

      // Range is a span inside the track span
      const root = container.firstChild as HTMLDivElement;
      const track = root.querySelector('span');
      const range = track?.querySelector('span');
      expect(range).toBeInTheDocument();
      expect(range).toHaveClass('absolute', 'h-full', 'bg-primary');
    });
  });

  describe('Thumb', () => {
    it('renders thumb element', () => {
      const { container } = render(<Slider value={[50]} />);

      // Thumb is the slider role element
      const thumb = container.querySelector('[role="slider"]');
      expect(thumb).toBeInTheDocument();
      expect(thumb).toHaveClass('block', 'h-5', 'w-5');
      expect(thumb).toHaveClass('rounded-full', 'border-2', 'border-primary');
      expect(thumb).toHaveClass('bg-background', 'ring-offset-background');
    });

    it('renders thumb with focus-visible styles', () => {
      const { container } = render(<Slider value={[50]} />);

      const thumb = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(thumb.className).toContain('focus-visible:outline-none');
      expect(thumb.className).toContain('focus-visible:ring-2');
      expect(thumb.className).toContain('focus-visible:ring-ring');
      expect(thumb.className).toContain('focus-visible:ring-offset-2');
    });

    it('renders thumb with transition styles', () => {
      const { container } = render(<Slider value={[50]} />);

      const thumb = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(thumb.className).toContain('transition-colors');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      const { container } = render(<Slider value={[50]} min={0} max={100} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider).toHaveAttribute('role', 'slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    it('has proper ARIA orientation', () => {
      const { container } = render(
        <Slider value={[50]} orientation="horizontal" />,
      );

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('has tabindex for keyboard interaction', () => {
      const { container } = render(<Slider value={[50]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider).toHaveAttribute('tabindex', '0');
    });

    it('accepts custom aria-label on root element', () => {
      const { container } = render(<Slider value={[50]} aria-label="Volume" />);

      // aria-label is applied to the root element
      const root = container.firstChild as HTMLDivElement;
      expect(root).toHaveAttribute('aria-label', 'Volume');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero value', () => {
      const { container } = render(<Slider value={[0]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider.getAttribute('aria-valuenow')).toBe('0');
    });

    it('handles negative min value', () => {
      const { container } = render(<Slider min={-100} max={100} value={[0]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider.getAttribute('aria-valuemin')).toBe('-100');
    });

    it('handles decimal step', () => {
      const { container } = render(<Slider step={0.1} value={[50.5]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider.getAttribute('aria-valuenow')).toBe('50.5');
    });

    it('handles large max value', () => {
      const { container } = render(<Slider max={10000} value={[5000]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider.getAttribute('aria-valuemax')).toBe('10000');
      expect(slider.getAttribute('aria-valuenow')).toBe('5000');
    });

    it('handles all props combined', () => {
      const onValueChange = vi.fn();
      const ref = { current: null as HTMLElement | null };

      const { container } = render(
        <Slider
          ref={ref}
          className="combined-test"
          value={[30]}
          min={0}
          max={100}
          step={1}
          disabled={false}
          orientation="horizontal"
          onValueChange={onValueChange}
          aria-label="Test slider"
        />,
      );

      const root = container.firstChild as HTMLDivElement;
      expect(root).toHaveClass('combined-test');
      expect(root).toHaveClass('relative', 'flex', 'w-full');
      expect(root).toHaveAttribute('aria-label', 'Test slider');

      const slider = container.querySelector('[role="slider"]');
      expect(slider).toHaveAttribute('aria-valuenow', '30');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');

      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it('renders without value (uncontrolled)', () => {
      const { container } = render(<Slider defaultValue={[50]} />);

      const slider = container.querySelector(
        '[role="slider"]',
      ) as HTMLDivElement;
      expect(slider).toBeInTheDocument();
      expect(slider.getAttribute('aria-valuenow')).toBe('50');
    });
  });
});
