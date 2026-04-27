import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import { Label } from '../../../../src/components/ui/label';

describe('Label Component', () => {
  it('renders correctly with children', () => {
    render(<Label data-testid="test-label">Test Label</Label>);
    const label = screen.getByTestId('test-label');

    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Test Label');
    expect(label.tagName).toBe('LABEL');
  });

  it('applies default variance classes', () => {
    render(<Label data-testid="test-label">Test Label</Label>);
    const label = screen.getByTestId('test-label');

    expect(label).toHaveClass(
      'text-sm',
      'font-medium',
      'leading-none',
      'peer-disabled:cursor-not-allowed',
      'peer-disabled:opacity-70',
    );
  });

  it('merges custom className with default classes', () => {
    render(
      <Label data-testid="test-label" className="custom-test-class">
        Test Label
      </Label>,
    );
    const label = screen.getByTestId('test-label');

    expect(label).toHaveClass('custom-test-class', 'text-sm');
  });

  it('forwards additional props to the label element', () => {
    render(
      <Label data-testid="test-label" htmlFor="input-id">
        Test Label
      </Label>,
    );
    const label = screen.getByTestId('test-label');

    expect(label).toHaveAttribute('for', 'input-id');
  });

  it('forwards ref properly to the literal HTMLLabelElement', () => {
    const ref = React.createRef<HTMLLabelElement>();

    render(
      <Label ref={ref} data-testid="test-label">
        Test Label
      </Label>,
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current?.tagName).toBe('LABEL');
  });
});
