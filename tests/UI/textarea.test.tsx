import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('applies default className correctly', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass(
      'flex',
      'min-h-[80px]',
      'w-full',
      'rounded-md',
      'border',
    );
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-class" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
  });

  it('passes through HTML attributes', () => {
    render(<Textarea placeholder="Enter text..." rows={5} maxLength={100} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text...');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('maxlength', '100');
  });

  it('handles value prop', () => {
    render(<Textarea value="Test content" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Test content');
  });

  it('handles onChange event', () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: 'New value' }),
      }),
    );
  });

  it('handles onBlur event', () => {
    const handleBlur = vi.fn();
    render(<Textarea onBlur={handleBlur} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.blur(textarea);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('handles onFocus event', () => {
    const handleFocus = vi.fn();
    render(<Textarea onFocus={handleFocus} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it('applies disabled styles when disabled', () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass(
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
    );
  });

  it('applies focus-visible ring styles on focus', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);
    expect(textarea).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
    );
  });

  it('renders with default min-height', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('min-h-[80px]');
  });

  it('accepts data attributes', () => {
    render(<Textarea data-testid="textarea-test" data-id="123" />);
    const textarea = screen.getByTestId('textarea-test');
    expect(textarea).toHaveAttribute('data-id', '123');
  });

  it('accepts aria attributes', () => {
    render(<Textarea aria-label="Description" aria-required="true" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', 'Description');
    expect(textarea).toHaveAttribute('aria-required', 'true');
  });

  it('handles readOnly prop', () => {
    render(<Textarea readOnly />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('handles autoFocus prop', () => {
    render(<Textarea autoFocus />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveFocus();
  });
});
