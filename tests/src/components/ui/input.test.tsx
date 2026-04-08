import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import { Input } from '../../../../src/components/ui/input';

describe('Input Component', () => {
  it('renders an input element', () => {
    render(<Input data-testid="test-input" />);
    const inputElement = screen.getByTestId('test-input');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement.tagName).toBe('INPUT');
  });

  it('passes the type prop correctly', () => {
    render(<Input type="password" data-testid="password-input" />);
    const inputElement = screen.getByTestId('password-input');
    expect(inputElement).toHaveAttribute('type', 'password');
  });

  it('merges custom className with default classes', () => {
    render(<Input className="custom-class" data-testid="class-input" />);
    const inputElement = screen.getByTestId('class-input');

    // Check for the custom class
    expect(inputElement).toHaveClass('custom-class');
    // Check for a known default class
    expect(inputElement).toHaveClass('flex', 'h-10', 'w-full');
  });

  it('forwards additional props to the native input element', () => {
    render(
      <Input
        data-testid="prop-input"
        placeholder="Enter text..."
        disabled
        readOnly
      />,
    );
    const inputElement = screen.getByTestId('prop-input');

    expect(inputElement).toHaveAttribute('placeholder', 'Enter text...');
    expect(inputElement).toBeDisabled();
    expect(inputElement).toHaveAttribute('readonly');
  });

  it('forwards the ref to the native input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} data-testid="ref-input" />);

    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.tagName).toBe('INPUT');
  });

  it('supports user typing interaction', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="typing-input" />);

    const inputElement = screen.getByTestId('typing-input');
    await user.type(inputElement, 'Hello World');

    expect(inputElement).toHaveValue('Hello World');
  });
});
