import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Mock lucide-react Circle
vi.mock('lucide-react', () => ({
  Circle: () => <div data-testid="circle-icon">Circle</div>,
}));

describe('RadioGroup Components', () => {
  it('renders correctly', () => {
    render(
      <RadioGroup data-testid="radio-group" defaultValue="option-one">
        <RadioGroupItem value="option-one" data-testid="item-1" />
        <RadioGroupItem value="option-two" data-testid="item-2" />
      </RadioGroup>,
    );

    const group = screen.getByTestId('radio-group');
    expect(group).toBeInTheDocument();

    const item1 = screen.getByTestId('item-1');
    const item2 = screen.getByTestId('item-2');
    expect(item1).toBeInTheDocument();
    expect(item2).toBeInTheDocument();
  });

  it('selects the defaultValue correctly', () => {
    render(
      <RadioGroup defaultValue="option-one">
        <RadioGroupItem value="option-one" data-testid="item-1" />
        <RadioGroupItem value="option-two" data-testid="item-2" />
      </RadioGroup>,
    );

    const item1 = screen.getByTestId('item-1');
    const item2 = screen.getByTestId('item-2');

    expect(item1).toHaveAttribute('data-state', 'checked');
    expect(item2).toHaveAttribute('data-state', 'unchecked');

    // Radix UI renders indicator when checked. We can check if Circle exists inside it.
    expect(screen.getByTestId('circle-icon')).toBeInTheDocument();
  });

  it('changes selection when clicked via user interaction', async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup>
        <RadioGroupItem value="option-one" data-testid="item-1" />
        <RadioGroupItem value="option-two" data-testid="item-2" />
      </RadioGroup>,
    );

    const item1 = screen.getByTestId('item-1');
    const item2 = screen.getByTestId('item-2');

    expect(item1).toHaveAttribute('data-state', 'unchecked');
    expect(item2).toHaveAttribute('data-state', 'unchecked');

    await user.click(item2);

    await waitFor(() => {
      expect(item1).toHaveAttribute('data-state', 'unchecked');
      expect(item2).toHaveAttribute('data-state', 'checked');
    });
  });

  it('applies custom classNames correctly', () => {
    render(
      <RadioGroup className="custom-group-class" data-testid="group">
        <RadioGroupItem
          value="1"
          className="custom-item-class"
          data-testid="item"
        />
      </RadioGroup>,
    );

    expect(screen.getByTestId('group')).toHaveClass(
      'custom-group-class',
      'grid',
      'gap-2',
    );
    expect(screen.getByTestId('item')).toHaveClass(
      'custom-item-class',
      'aspect-square',
      'h-4',
      'w-4',
    );
  });

  it('forwards refs correctly', () => {
    const groupRef = React.createRef<HTMLDivElement>();
    const itemRef = React.createRef<HTMLButtonElement>();

    render(
      <RadioGroup ref={groupRef}>
        <RadioGroupItem value="1" ref={itemRef} />
      </RadioGroup>,
    );

    expect(groupRef.current).not.toBeNull();
    expect(groupRef.current).toBeInstanceOf(HTMLDivElement);

    expect(itemRef.current).not.toBeNull();
    expect(itemRef.current).toBeInstanceOf(HTMLButtonElement);
  });
});
