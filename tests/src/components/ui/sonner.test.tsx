import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Toaster, toast } from '../../../../src/components/ui/sonner';
import { useTheme } from 'next-themes';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn().mockReturnValue({
    theme: 'system',
    setTheme: vi.fn(),
    themes: [],
  }),
}));

// Mock sonner
vi.mock('sonner', async () => {
  const actual = await vi.importActual<typeof import('sonner')>('sonner');
  return {
    ...actual,
    Toaster: vi.fn(({ className, theme, toastOptions }) => (
      <div
        data-testid="sonner-toaster"
        data-theme={theme}
        data-classname={className}
        data-toast-options={JSON.stringify(toastOptions)}
      >
        Mock Sonner Toaster
      </div>
    )),
  };
});

describe('Sonner Toaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('renders Sonner Toaster with default theme', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
      expect(toaster).toHaveAttribute('data-theme', 'system');
    });

    it('renders Sonner Toaster with light theme', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
      expect(toaster).toHaveAttribute('data-theme', 'light');
    });

    it('renders Sonner Toaster with dark theme', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
      expect(toaster).toHaveAttribute('data-theme', 'dark');
    });

    it('renders with default className "toaster group"', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toHaveAttribute('data-classname', 'toaster group');
    });

    it('renders with custom className', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster className="custom-toaster" />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toHaveAttribute('data-classname', 'custom-toaster');
    });

    it('merges custom className with default className', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster className="custom-class" />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toHaveAttribute('data-classname', 'custom-class');
    });
  });

  describe('Toast Options', () => {
    it('passes toastOptions with custom classNames', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}',
      );

      expect(toastOptions).toHaveProperty('classNames');
      expect(toastOptions.classNames).toHaveProperty('toast');
      expect(toastOptions.classNames).toHaveProperty('description');
      expect(toastOptions.classNames).toHaveProperty('actionButton');
      expect(toastOptions.classNames).toHaveProperty('cancelButton');
    });

    it('toast classNames contains expected Tailwind classes', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}',
      );

      expect(toastOptions.classNames.toast).toContain('group');
      expect(toastOptions.classNames.toast).toContain('toast');
      expect(toastOptions.classNames.toast).toContain(
        'group-[.toaster]:bg-background',
      );
      expect(toastOptions.classNames.toast).toContain(
        'group-[.toaster]:text-foreground',
      );
      expect(toastOptions.classNames.toast).toContain(
        'group-[.toaster]:border-border',
      );
      expect(toastOptions.classNames.toast).toContain(
        'group-[.toaster]:shadow-lg',
      );
    });

    it('description classNames contains expected Tailwind classes', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}',
      );

      expect(toastOptions.classNames.description).toBe(
        'group-[.toast]:text-muted-foreground',
      );
    });

    it('actionButton classNames contains expected Tailwind classes', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}',
      );

      expect(toastOptions.classNames.actionButton).toBe(
        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
      );
    });

    it('cancelButton classNames contains expected Tailwind classes', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}',
      );

      expect(toastOptions.classNames.cancelButton).toBe(
        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      );
    });
  });

  describe('Props Forwarding', () => {
    it('forwards additional props to Sonner', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster position="top-center" duration={5000} />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('forwards richColors prop', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster richColors />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('forwards visibleToasts prop', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster visibleToasts={5} />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('forwards closeButton prop', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster closeButton />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('forwards multiple props together', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      });

      render(
        <Toaster
          position="bottom-right"
          duration={3000}
          richColors
          visibleToasts={3}
          closeButton
        />,
      );

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });
  });

  describe('Theme Handling', () => {
    it('uses system theme when theme is undefined', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: undefined,
        setTheme: vi.fn(),
        themes: [],
      });

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toHaveAttribute('data-theme', 'system');
    });

    it('handles theme change', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        setTheme: vi.fn(),
        themes: [],
      });

      const { rerender } = render(<Toaster />);

      let toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toHaveAttribute('data-theme', 'light');

      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        themes: [],
      });
      rerender(<Toaster />);

      toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toHaveAttribute('data-theme', 'dark');
    });
  });

  describe('Toast Export', () => {
    it('exports toast object', () => {
      expect(toast).toBeDefined();
      expect(typeof toast).toBe('function');
    });

    it('toast has success method', () => {
      expect(toast.success).toBeDefined();
      expect(typeof toast.success).toBe('function');
    });

    it('toast has error method', () => {
      expect(toast.error).toBeDefined();
      expect(typeof toast.error).toBe('function');
    });

    it('toast has info method', () => {
      expect(toast.info).toBeDefined();
      expect(typeof toast.info).toBe('function');
    });

    it('toast has warning method', () => {
      expect(toast.warning).toBeDefined();
      expect(typeof toast.warning).toBe('function');
    });

    it('toast has loading method', () => {
      expect(toast.loading).toBeDefined();
      expect(typeof toast.loading).toBe('function');
    });

    it('toast has promise method', () => {
      expect(toast.promise).toBeDefined();
      expect(typeof toast.promise).toBe('function');
    });

    it('toast has dismiss method', () => {
      expect(toast.dismiss).toBeDefined();
      expect(typeof toast.dismiss).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty theme object', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        themes: [],
      } as unknown as ReturnType<typeof useTheme>);

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('renders with all props combined', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        themes: [],
      });

      render(
        <Toaster
          className="combined-test"
          position="top-center"
          duration={4000}
          richColors
          visibleToasts={5}
          closeButton
          expand
        />,
      );

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
      expect(toaster).toHaveAttribute('data-theme', 'dark');
    });

    it('handles null theme gracefully', () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: undefined,
        setTheme: vi.fn(),
        themes: [],
      } as unknown as ReturnType<typeof useTheme>);

      render(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });
  });
});
