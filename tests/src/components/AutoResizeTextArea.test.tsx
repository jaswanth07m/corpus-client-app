import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { AutoResizeTextArea } from '../../../src/components/AutoResizeTextArea';

describe('AutoResizeTextArea', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders without crashing', () => {
    render(<AutoResizeTextArea value="" onChange={mockOnChange} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays the provided value', () => {
    render(<AutoResizeTextArea value="Hello World" onChange={mockOnChange} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Hello World');
  });

  it('calls onChange when text is typed', () => {
    render(<AutoResizeTextArea value="" onChange={mockOnChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'new text' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('applies the placeholder prop', () => {
    render(
      <AutoResizeTextArea
        value=""
        onChange={mockOnChange}
        placeholder="Enter text here"
      />,
    );
    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  it('applies disabled prop', () => {
    render(<AutoResizeTextArea value="" onChange={mockOnChange} disabled />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeDisabled();
  });

  it('applies additional className prop', () => {
    const { container } = render(
      <AutoResizeTextArea
        value=""
        onChange={mockOnChange}
        className="my-custom-class"
      />,
    );
    const textarea = container.querySelector('textarea');
    expect(textarea?.className).toContain('my-custom-class');
  });

  it('applies minHeight style when provided', () => {
    const { container } = render(
      <AutoResizeTextArea value="" onChange={mockOnChange} minHeight="100px" />,
    );
    const textarea = container.querySelector('textarea');
    expect(textarea?.style.minHeight).toBe('100px');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <AutoResizeTextArea
        value=""
        onChange={mockOnChange}
        data-testid="custom-textarea"
        aria-label="Custom label"
      />,
    );
    const textarea = screen.getByTestId('custom-textarea');
    expect(textarea).toHaveAttribute('aria-label', 'Custom label');
  });

  it('uses overflow: hidden to prevent scrollbar during resize', () => {
    const { container } = render(
      <AutoResizeTextArea value="" onChange={mockOnChange} />,
    );
    const textarea = container.querySelector('textarea');
    expect(textarea?.style.overflow).toBe('hidden');
  });
});
