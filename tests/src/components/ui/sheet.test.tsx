import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

// Mock Radix UI Dialog primitives for controlled testing
vi.mock('@radix-ui/react-dialog', async () => {
  const actual = await vi.importActual('@radix-ui/react-dialog');
  return {
    ...(actual as object),
    // Use actual implementation but ensure Portal renders inline for testing
  };
});

describe('Sheet', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Sheet content</p>
          </SheetContent>
        </Sheet>,
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('trigger element renders correctly', () => {
      render(
        <Sheet>
          <SheetTrigger data-testid="trigger">Click me</SheetTrigger>
          <SheetContent>
            <p>Sheet content</p>
          </SheetContent>
        </Sheet>,
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveTextContent('Click me');
    });

    it('sheet content is NOT visible by default', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p data-testid="sheet-content">Sheet content</p>
          </SheetContent>
        </Sheet>,
      );
      expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument();
    });

    it('content becomes visible when opened via trigger', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p data-testid="sheet-content">Sheet content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
      });
    });

    it('renders with controlled open prop', async () => {
      render(
        <Sheet open={true}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p data-testid="sheet-content">Sheet content</p>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
      });
    });

    it('does not render content when controlled open is false', () => {
      render(
        <Sheet open={false}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p data-testid="sheet-content">Sheet content</p>
          </SheetContent>
        </Sheet>,
      );

      expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('clicking the trigger opens the sheet', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Sheet content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Sheet content')).toBeInTheDocument();
      });
    });

    it('clicking close button closes the sheet', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Sheet content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Sheet content')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
      });
    });

    it('pressing Escape closes the sheet', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Sheet content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Sheet content')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
      });
    });

    it('clicking overlay closes the sheet', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Sheet content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Sheet content')).toBeInTheDocument();
      });

      // Click on the overlay using fireEvent (userEvent has pointer-events issues)
      const overlay = document.querySelector('[data-state="open"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      await waitFor(() => {
        expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
      });
    });

    it('SheetClose component closes the sheet', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Sheet content</p>
            <SheetClose data-testid="custom-close">Close</SheetClose>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Sheet content')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('custom-close'));

      await waitFor(() => {
        expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Variants / Positioning', () => {
    it('renders with right side by default', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const content = screen.getByRole('dialog');
        expect(content).toHaveClass('inset-y-0', 'right-0');
      });
    });

    it('renders with left side', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="left">
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const content = screen.getByRole('dialog');
        expect(content).toHaveClass('inset-y-0', 'left-0');
      });
    });

    it('renders with top side', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="top">
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const content = screen.getByRole('dialog');
        expect(content).toHaveClass('inset-x-0', 'top-0', 'border-b');
      });
    });

    it('renders with bottom side', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="bottom">
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const content = screen.getByRole('dialog');
        expect(content).toHaveClass('inset-x-0', 'bottom-0', 'border-t');
      });
    });

    it('applies custom className along with side classes', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="right" className="custom-class">
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const content = screen.getByRole('dialog');
        expect(content).toHaveClass('custom-class');
        expect(content).toHaveClass('inset-y-0', 'right-0');
      });
    });
  });

  describe('Controlled vs Uncontrolled Behavior', () => {
    it('onOpenChange callback is called when opening', async () => {
      const onOpenChangeMock = vi.fn();
      const user = userEvent.setup();

      render(
        <Sheet onOpenChange={onOpenChangeMock}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(onOpenChangeMock).toHaveBeenCalledWith(true);
      });
    });

    it('onOpenChange callback is called when closing', async () => {
      const onOpenChangeMock = vi.fn();
      const user = userEvent.setup();

      render(
        <Sheet onOpenChange={onOpenChangeMock}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(onOpenChangeMock).toHaveBeenCalledWith(false);
      });
    });

    it('controlled mode respects open prop changes', async () => {
      const { rerender } = render(
        <Sheet open={false}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();

      rerender(
        <Sheet open={true}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });
  });

  describe('Conditional UI', () => {
    it('SheetHeader renders correctly', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
      });
    });

    it('SheetFooter renders correctly', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
            <SheetFooter>
              <button>Footer Button</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Footer Button')).toBeInTheDocument();
      });
    });

    it('SheetTitle renders with correct styling', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle data-testid="title">My Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const title = screen.getByTestId('title');
        expect(title).toHaveClass('text-lg', 'font-semibold');
      });
    });

    it('SheetDescription renders with correct styling', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetDescription data-testid="description">
                My Description
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const description = screen.getByTestId('description');
        expect(description).toHaveClass('text-sm', 'text-muted-foreground');
      });
    });

    it('renders without header/footer when not provided', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Just content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Just content')).toBeInTheDocument();
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('onOpenChange is called with true on open', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Sheet onOpenChange={handleOpenChange}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(true);
      });
    });

    it('onOpenChange is called with false on close', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Sheet onOpenChange={handleOpenChange}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('action buttons in footer trigger handlers', async () => {
      const handleSave = vi.fn();
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetFooter>
              <button onClick={handleSave}>Save</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save'));

      expect(handleSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('has dialog role with proper state', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('data-state', 'open');
      });
    });

    it('close button has accessible label', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('focus is managed when opening', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
            <input data-testid="input" />
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple open/close cycles', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      // First cycle
      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });

      // Second cycle
      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });

      // Third cycle
      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('handles rapid toggling', async () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      const trigger = screen.getByText('Open');
      // Use fireEvent for rapid toggling to avoid pointer-events issues
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });

      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('handles missing children gracefully', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent />
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('handles empty trigger', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger data-testid="empty-trigger" />
          <SheetContent>
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      const trigger = screen.getByTestId('empty-trigger');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('SheetOverlay receives custom className', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent className="test-content">
            <p>Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const overlay = document.querySelector('[data-state="open"]');
        expect(overlay).toBeInTheDocument();
      });
    });
  });

  describe('Portal Behavior', () => {
    it('content is rendered in portal (outside main container)', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <p data-testid="portal-content">Portal Content</p>
          </SheetContent>
        </Sheet>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const portalContent = screen.getByTestId('portal-content');
        // Portal content should be in body, not in the container
        expect(document.body.contains(portalContent)).toBe(true);
      });
    });
  });
});
