import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../../../../src/components/ui/switch';

describe('Switch', () => {
  describe('Rendering', () => {
    it('renders switch with default classes', () => {
      const { container } = render(<Switch />);

      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeInTheDocument();

      const root = container.firstChild as HTMLButtonElement;
      expect(root).toHaveClass('peer', 'inline-flex', 'h-6', 'w-11');
      expect(root).toHaveClass('shrink-0', 'cursor-pointer', 'items-center');
      expect(root).toHaveClass(
        'rounded-full',
        'border-2',
        'border-transparent',
      );
      expect(root).toHaveClass('transition-colors');
      expect(root).toHaveClass('focus-visible:outline-none');
      expect(root).toHaveClass(
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
      );
      expect(root).toHaveClass(
        'focus-visible:ring-offset-2',
        'focus-visible:ring-offset-background',
      );
    });

    it('renders switch with custom className', () => {
      const { container } = render(<Switch className="custom-class" />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root).toHaveClass('custom-class');
      expect(root).toHaveClass('peer', 'inline-flex', 'h-6', 'w-11');
    });

    it('merges custom className with default classes', () => {
      const { container } = render(<Switch className="bg-custom" />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root).toHaveClass('bg-custom');
      expect(root).toHaveClass('peer', 'inline-flex', 'h-6', 'w-11');
    });
  });

  describe('Checked State', () => {
    it('renders unchecked by default', () => {
      const { container } = render(<Switch />);

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    it('renders checked when checked prop is true', () => {
      const { container } = render(<Switch checked />);

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('renders unchecked when checked prop is false', () => {
      const { container } = render(<Switch checked={false} />);

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    it('applies checked background color', () => {
      const { container } = render(<Switch checked />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root.className).toContain('data-[state=checked]:bg-primary');
    });

    it('applies unchecked background color', () => {
      const { container } = render(<Switch checked={false} />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root.className).toContain('data-[state=unchecked]:bg-input');
    });
  });

  describe('Thumb Element', () => {
    it('renders thumb element inside the switch', () => {
      const { container } = render(<Switch />);

      const root = container.firstChild as HTMLButtonElement;
      const thumb = root.querySelector('span');
      expect(thumb).toBeInTheDocument();
      expect(thumb).toHaveClass('pointer-events-none', 'block');
      expect(thumb).toHaveClass('h-5', 'w-5', 'rounded-full');
      expect(thumb).toHaveClass('bg-background', 'shadow-lg');
    });

    it('renders thumb with transition class', () => {
      const { container } = render(<Switch />);

      const root = container.firstChild as HTMLButtonElement;
      const thumb = root.querySelector('span');
      expect(thumb).toHaveClass('transition-transform');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled switch', () => {
      const { container } = render(<Switch disabled />);

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('data-disabled');
    });

    it('applies disabled cursor style', () => {
      const { container } = render(<Switch disabled />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root.className).toContain('disabled:cursor-not-allowed');
    });

    it('applies disabled opacity style', () => {
      const { container } = render(<Switch disabled />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root.className).toContain('disabled:opacity-50');
    });

    it('cannot be toggled when disabled', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Switch disabled onCheckedChange={onCheckedChange} />,
      );

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      await user.click(switchElement);

      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    it('calls onCheckedChange when clicked', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Switch onCheckedChange={onCheckedChange} />,
      );

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      await user.click(switchElement);

      expect(onCheckedChange).toHaveBeenCalled();
    });

    it('calls onCheckedChange with new checked value', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Switch checked={false} onCheckedChange={onCheckedChange} />,
      );

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      await user.click(switchElement);

      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('calls onCheckedChange when toggled with keyboard', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Switch onCheckedChange={onCheckedChange} />,
      );

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      switchElement.focus();
      await user.keyboard('{Enter}');

      expect(onCheckedChange).toHaveBeenCalled();
    });

    it('calls onCheckedChange with Space key', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Switch onCheckedChange={onCheckedChange} />,
      );

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      switchElement.focus();
      await user.keyboard(' ');

      expect(onCheckedChange).toHaveBeenCalled();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to the SwitchPrimitives.Root element', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Switch ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('forwards ref with custom className', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Switch ref={ref} className="ref-test-class" />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveClass('ref-test-class');
    });

    it('forwards ref with checked state', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Switch ref={ref} checked />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('Accessibility', () => {
    it('has role="switch"', () => {
      const { container } = render(<Switch />);

      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('role', 'switch');
    });

    it('has aria-checked attribute when checked', () => {
      const { container } = render(<Switch checked />);

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('has aria-checked attribute when unchecked', () => {
      const { container } = render(<Switch checked={false} />);

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('accepts aria-label', () => {
      const { container } = render(<Switch aria-label="Toggle setting" />);

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('aria-label', 'Toggle setting');
    });

    it('accepts aria-labelledby', () => {
      const { container } = render(<Switch aria-labelledby="label-id" />);

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('accepts aria-describedby', () => {
      const { container } = render(
        <Switch aria-describedby="description-id" />,
      );

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute(
        'aria-describedby',
        'description-id',
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles controlled state changes', () => {
      const { container, rerender } = render(<Switch checked={false} />);

      let switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');

      rerender(<Switch checked />);

      switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('renders with all props combined', () => {
      const onCheckedChange = vi.fn();
      const ref = { current: null as HTMLButtonElement | null };

      const { container } = render(
        <Switch
          ref={ref}
          className="combined-test"
          checked={true}
          disabled={false}
          aria-label="Test switch"
          onCheckedChange={onCheckedChange}
        />,
      );

      const root = container.firstChild as HTMLButtonElement;
      expect(root).toHaveClass('combined-test');
      expect(root).toHaveClass('peer', 'inline-flex', 'h-6', 'w-11');

      const switchElement = container.querySelector(
        '[role="switch"]',
      ) as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('aria-label', 'Test switch');
      expect(switchElement).toHaveAttribute('data-state', 'checked');

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('handles focus-visible styles', () => {
      const { container } = render(<Switch />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root.className).toContain('focus-visible:outline-none');
      expect(root.className).toContain('focus-visible:ring-2');
      expect(root.className).toContain('focus-visible:ring-ring');
      expect(root.className).toContain('focus-visible:ring-offset-2');
      expect(root.className).toContain('focus-visible:ring-offset-background');
    });

    it('renders with transition classes', () => {
      const { container } = render(<Switch />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root.className).toContain('transition-colors');

      const thumb = root.querySelector('span');
      expect(thumb).toHaveClass('transition-transform');
    });

    it('handles null children gracefully', () => {
      const { container } = render(<Switch>{null}</Switch>);

      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeInTheDocument();
    });

    it('renders with unchecked state explicitly set', () => {
      const { container } = render(<Switch checked={false} />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root.className).toContain('data-[state=unchecked]:bg-input');
    });

    it('renders with checked state explicitly set', () => {
      const { container } = render(<Switch checked />);

      const root = container.firstChild as HTMLButtonElement;
      expect(root.className).toContain('data-[state=checked]:bg-primary');
    });
  });
});
