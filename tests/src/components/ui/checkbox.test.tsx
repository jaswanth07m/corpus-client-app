import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox data-testid="checkbox" />);
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  it('merges custom classNames properly', () => {
    render(<Checkbox data-testid="checkbox" className="custom-class" />);
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveClass('custom-class');
    expect(checkbox).toHaveClass('peer');
    expect(checkbox).toHaveClass('rounded-sm');
  });

  it('can be checked and unchecked with user click', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox data-testid="checkbox" onCheckedChange={onCheckedChange} />,
    );

    const checkbox = screen.getByTestId('checkbox');

    // Initial state
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    // Indicator isn't rendered
    expect(document.querySelector('.lucide-check')).not.toBeInTheDocument();

    // Click to check
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(onCheckedChange).toHaveBeenCalledTimes(1);

    // Indicator renders inside the checked checkbox
    expect(document.querySelector('.lucide-check')).toBeInTheDocument();

    // Click to uncheck
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
  });

  it('respects defaultChecked properly', () => {
    render(<Checkbox data-testid="checkbox" defaultChecked />);
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    expect(document.querySelector('.lucide-check')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is provided', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        data-testid="checkbox"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toBeDisabled();

    await user.click(checkbox);
    // Remains unchecked since click is blocked
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('forwards ref properly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} data-testid="checkbox" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
