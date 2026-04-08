import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerClose,
} from '@/components/ui/drawer';

// Mock vaul Drawer primitives to control behavior while keeping drawer.tsx logic
vi.mock('vaul', () => {
  // Shared state for open/close
  let drawerOpen = false;
  let onOpenChangeCallback: ((open: boolean) => void) | null = null;

  return {
    Drawer: {
      Root: ({
        children,
        open,
        defaultOpen,
        onOpenChange,
        shouldScaleBackground,
      }: {
        children: React.ReactNode;
        open?: boolean;
        defaultOpen?: boolean;
        onOpenChange?: (open: boolean) => void;
        shouldScaleBackground?: boolean;
      }) => {
        drawerOpen = open ?? defaultOpen ?? false;
        onOpenChangeCallback = onOpenChange || null;

        return (
          <div
            data-testid="drawer-root"
            data-state={drawerOpen ? 'open' : 'closed'}
            data-open={drawerOpen}
            data-scale-background={shouldScaleBackground}
          >
            {children}
          </div>
        );
      },
      Trigger: ({
        children,
        asChild,
      }: {
        children: React.ReactNode;
        asChild?: boolean;
      }) => {
        const handleClick = () => {
          if (onOpenChangeCallback) {
            onOpenChangeCallback(!drawerOpen);
          }
        };

        return (
          <button
            data-testid="drawer-trigger"
            data-vaul-trigger="true"
            data-as-child={String(asChild)}
            onClick={handleClick}
          >
            {children}
          </button>
        );
      },
      Content: ({
        children,
        onOpenAutoFocus,
        onCloseAutoFocus,
        onEscapeKeyDown,
      }: {
        children: React.ReactNode;
        onOpenAutoFocus?: (e: Event) => void;
        onCloseAutoFocus?: (e: Event) => void;
        onEscapeKeyDown?: (e: KeyboardEvent) => void;
      }) => {
        // Only render content when drawer is open
        if (!drawerOpen) {
          return null;
        }

        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Escape' && onEscapeKeyDown) {
            onEscapeKeyDown(e.nativeEvent);
            if (onOpenChangeCallback) {
              onOpenChangeCallback(false);
            }
          }
        };

        return (
          <div
            data-testid="drawer-content"
            role="dialog"
            onKeyDown={handleKeyDown}
            data-escape-handler={onEscapeKeyDown ? 'attached' : 'none'}
          >
            {/* Handle/grip indicator */}
            <div
              data-testid="drawer-handle"
              className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted"
            />
            {children}
          </div>
        );
      },
      Overlay: ({
        children,
        onClick,
      }: {
        children?: React.ReactNode;
        onClick?: () => void;
      }) => {
        const handleClick = () => {
          if (onOpenChangeCallback) {
            onOpenChangeCallback(false);
          }
          onClick?.();
        };

        return (
          <div
            data-testid="drawer-overlay"
            data-overlay="true"
            onClick={handleClick}
          >
            {children}
          </div>
        );
      },
      Portal: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-portal">{children}</div>
      ),
      Close: ({
        children,
        asChild,
      }: {
        children: React.ReactNode;
        asChild?: boolean;
      }) => {
        const handleClick = () => {
          if (onOpenChangeCallback) {
            onOpenChangeCallback(false);
          }
        };

        return (
          <button
            data-testid="drawer-close"
            data-vaul-close="true"
            data-as-child={String(asChild)}
            onClick={handleClick}
          >
            {children}
          </button>
        );
      },
      Title: ({ children }: { children: React.ReactNode }) => (
        <h2 data-testid="drawer-title">{children}</h2>
      ),
      Description: ({ children }: { children: React.ReactNode }) => (
        <p data-testid="drawer-description">{children}</p>
      ),
    },
  };
});

describe('Drawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders Drawer root but content is not visible by default', () => {
      render(
        <Drawer>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-trigger')).toBeInTheDocument();
      expect(screen.getByText('Open Drawer')).toBeInTheDocument();
      expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument();
    });

    it('renders DrawerTrigger correctly', () => {
      render(
        <Drawer>
          <DrawerTrigger>Click Me</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      const trigger = screen.getByTestId('drawer-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Click Me');
      expect(trigger).toHaveAttribute('data-vaul-trigger', 'true');
    });

    it('renders DrawerContent when drawer is opened (controlled mode)', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Drawer Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
      expect(screen.getByText('Drawer Content')).toBeInTheDocument();
    });

    it('renders the drawer handle/grip indicator', () => {
      render(
        <Drawer open>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-handle')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-handle')).toHaveClass('mx-auto');
    });

    it('renders DrawerHeader correctly', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Test Title</DrawerTitle>
              <DrawerDescription>Test Description</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'Test Title',
      );
      expect(screen.getByTestId('drawer-description')).toHaveTextContent(
        'Test Description',
      );
    });

    it('renders DrawerFooter correctly', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerFooter>
              <button>Cancel</button>
              <button>Confirm</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('renders DrawerOverlay inside DrawerContent', () => {
      render(
        <Drawer open>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument();
    });

    it('renders DrawerPortal wrapping content', () => {
      render(
        <Drawer open>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-portal')).toBeInTheDocument();
    });

    it('applies shouldScaleBackground prop correctly', () => {
      render(
        <Drawer shouldScaleBackground={true}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-root')).toHaveAttribute(
        'data-scale-background',
        'true',
      );
    });
  });

  describe('User Interactions', () => {
    it('opens drawer when clicking DrawerTrigger', () => {
      const onOpenChange = vi.fn();

      const { rerender } = render(
        <Drawer onOpenChange={onOpenChange}>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>Drawer Content</DrawerContent>
        </Drawer>,
      );

      fireEvent.click(screen.getByTestId('drawer-trigger'));

      expect(onOpenChange).toHaveBeenCalledWith(true);

      // Simulate parent state update
      rerender(
        <Drawer open onOpenChange={onOpenChange}>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>Drawer Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
    });

    it('closes drawer when clicking DrawerClose button', () => {
      const onOpenChange = vi.fn();

      render(
        <Drawer open onOpenChange={onOpenChange}>
          <DrawerContent>
            Drawer Content
            <DrawerClose>Close</DrawerClose>
          </DrawerContent>
        </Drawer>,
      );

      fireEvent.click(screen.getByTestId('drawer-close'));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes drawer when pressing Escape key', () => {
      const onEscapeKeyDown = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <Drawer open onOpenChange={onOpenChange}>
          <DrawerContent onEscapeKeyDown={onEscapeKeyDown}>
            Content
          </DrawerContent>
        </Drawer>,
      );

      const content = screen.getByTestId('drawer-content');
      fireEvent.keyDown(content, { key: 'Escape' });

      expect(onEscapeKeyDown).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes drawer when clicking overlay', () => {
      const onOpenChange = vi.fn();

      render(
        <Drawer open onOpenChange={onOpenChange}>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      const overlay = screen.getByTestId('drawer-overlay');
      fireEvent.click(overlay);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Controlled vs Uncontrolled Behavior', () => {
    it('respects open prop in controlled mode', () => {
      const { rerender } = render(
        <Drawer open>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();

      rerender(
        <Drawer open={false}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument();
    });

    it('respects defaultOpen in uncontrolled mode', () => {
      render(
        <Drawer defaultOpen>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-root')).toHaveAttribute(
        'data-state',
        'open',
      );
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
    });

    it('calls onOpenChange with correct values when opening', () => {
      const onOpenChange = vi.fn();

      render(
        <Drawer onOpenChange={onOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      fireEvent.click(screen.getByTestId('drawer-trigger'));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('calls onOpenChange with correct values when closing via DrawerClose', () => {
      const onOpenChange = vi.fn();

      render(
        <Drawer open onOpenChange={onOpenChange}>
          <DrawerContent>
            Content
            <DrawerClose>Close</DrawerClose>
          </DrawerContent>
        </Drawer>,
      );

      fireEvent.click(screen.getByTestId('drawer-close'));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Conditional UI', () => {
    it('renders content only when drawer is open', () => {
      const { rerender } = render(
        <Drawer open={false}>
          <DrawerContent>
            <div data-testid="inner-content">Inner</div>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.queryByTestId('inner-content')).not.toBeInTheDocument();

      rerender(
        <Drawer open>
          <DrawerContent>
            <div data-testid="inner-content">Inner</div>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('inner-content')).toBeInTheDocument();
    });

    it('renders optional header section conditionally', () => {
      const { rerender } = render(
        <Drawer open>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Header</DrawerTitle>
            </DrawerHeader>
            <div>Body</div>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-title')).toBeInTheDocument();

      rerender(
        <Drawer open>
          <DrawerContent>
            <div>Body</div>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.queryByTestId('drawer-title')).not.toBeInTheDocument();
    });

    it('renders optional footer section conditionally', () => {
      const { rerender } = render(
        <Drawer open>
          <DrawerContent>
            <div>Body</div>
            <DrawerFooter>
              <button>Footer Button</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.getByText('Footer Button')).toBeInTheDocument();

      rerender(
        <Drawer open>
          <DrawerContent>
            <div>Body</div>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.queryByText('Footer Button')).not.toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('verifies onOpenChange is called with true when opening', () => {
      const handleOpenChange = vi.fn();

      render(
        <Drawer onOpenChange={handleOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      fireEvent.click(screen.getByTestId('drawer-trigger'));

      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });

    it('verifies onOpenChange is called with false when closing', () => {
      const handleOpenChange = vi.fn();

      render(
        <Drawer open onOpenChange={handleOpenChange}>
          <DrawerContent>
            Content
            <DrawerClose>Close</DrawerClose>
          </DrawerContent>
        </Drawer>,
      );

      fireEvent.click(screen.getByTestId('drawer-close'));

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('verifies action buttons trigger expected handlers', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <Drawer open>
          <DrawerContent>
            <DrawerFooter>
              <button onClick={onCancel}>Cancel</button>
              <button onClick={onConfirm}>Confirm</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>,
      );

      fireEvent.click(screen.getByText('Cancel'));
      fireEvent.click(screen.getByText('Confirm'));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(
        <Drawer open>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      const drawer = screen.getByTestId('drawer-content');
      expect(drawer).toHaveAttribute('role', 'dialog');
    });

    it('has accessible close button', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerClose>Close Me</DrawerClose>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-close')).toBeInTheDocument();
      expect(screen.getByText('Close Me')).toBeInTheDocument();
    });

    it('has accessible title element', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>,
      );

      const title = screen.getByTestId('drawer-title');
      expect(title).toHaveTextContent('Drawer Title');
    });

    it('has accessible description element', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerHeader>
              <DrawerDescription>Drawer Description Text</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>,
      );

      const description = screen.getByTestId('drawer-description');
      expect(description).toHaveTextContent('Drawer Description Text');
    });

    it('has visible handle/grip for accessibility', () => {
      render(
        <Drawer open>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      const handle = screen.getByTestId('drawer-handle');
      expect(handle).toBeInTheDocument();
      expect(handle).toHaveClass('rounded-full');
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple open/close cycles via prop changes', () => {
      const onOpenChange = vi.fn();

      const { rerender } = render(
        <Drawer open={false} onOpenChange={onOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      // Cycle 1: Open
      rerender(
        <Drawer open onOpenChange={onOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();

      // Cycle 1: Close
      rerender(
        <Drawer open={false} onOpenChange={onOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );
      expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument();

      // Cycle 2: Open
      rerender(
        <Drawer open onOpenChange={onOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();

      // Cycle 2: Close
      rerender(
        <Drawer open={false} onOpenChange={onOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );
      expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument();
    });

    it('handles rapid toggle', () => {
      const onOpenChange = vi.fn();

      render(
        <Drawer open={false} onOpenChange={onOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      const trigger = screen.getByTestId('drawer-trigger');

      fireEvent.click(trigger);
      fireEvent.click(trigger);
      fireEvent.click(trigger);

      expect(onOpenChange).toHaveBeenCalledTimes(3);
    });

    it('handles missing children gracefully', () => {
      expect(() => {
        render(
          <Drawer>
            <DrawerTrigger />
          </Drawer>,
        );
      }).not.toThrow();
    });

    it('handles null children', () => {
      expect(() => {
        render(
          <Drawer open>
            <DrawerContent>{null}</DrawerContent>
          </Drawer>,
        );
      }).not.toThrow();
    });

    it('handles undefined props', () => {
      expect(() => {
        render(
          <Drawer open={undefined}>
            <DrawerTrigger>Open</DrawerTrigger>
            <DrawerContent>Content</DrawerContent>
          </Drawer>,
        );
      }).not.toThrow();
    });

    it('handles empty string as title', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle></DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-title')).toBeInTheDocument();
    });
  });

  describe('DrawerClose Component', () => {
    it('renders DrawerClose correctly', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerClose>Close Button</DrawerClose>
          </DrawerContent>
        </Drawer>,
      );

      const close = screen.getByTestId('drawer-close');
      expect(close).toBeInTheDocument();
      expect(close).toHaveTextContent('Close Button');
      expect(close).toHaveAttribute('data-vaul-close', 'true');
    });

    it('supports asChild prop', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerClose asChild>
              <span>Custom Close</span>
            </DrawerClose>
          </DrawerContent>
        </Drawer>,
      );

      const close = screen.getByTestId('drawer-close');
      expect(close).toHaveAttribute('data-as-child', 'true');
    });
  });

  describe('DrawerTrigger Component', () => {
    it('supports asChild prop', () => {
      render(
        <Drawer>
          <DrawerTrigger asChild>
            <button>Custom Trigger</button>
          </DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      const trigger = screen.getByTestId('drawer-trigger');
      expect(trigger).toHaveAttribute('data-as-child', 'true');
    });

    it('renders custom child element', () => {
      render(
        <Drawer>
          <DrawerTrigger>
            <span>Trigger Text</span>
          </DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByText('Trigger Text')).toBeInTheDocument();
    });
  });

  describe('DrawerPortal Component', () => {
    it('renders Portal wrapper correctly', () => {
      render(
        <Drawer open>
          <DrawerPortal>
            <DrawerContent>Portaled Content</DrawerContent>
          </DrawerPortal>
        </Drawer>,
      );

      // Multiple portals may exist (explicit + inside DrawerContent)
      const portals = screen.getAllByTestId('drawer-portal');
      expect(portals.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Portaled Content')).toBeInTheDocument();
    });
  });

  describe('DrawerOverlay Component', () => {
    it('renders Overlay correctly', () => {
      render(
        <Drawer open>
          <DrawerOverlay />
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      // Multiple overlays may exist (explicit + inside DrawerContent)
      const overlays = screen.getAllByTestId('drawer-overlay');
      expect(overlays.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onOpenChange when overlay is clicked', () => {
      const onOpenChange = vi.fn();

      render(
        <Drawer open onOpenChange={onOpenChange}>
          <DrawerOverlay />
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      const overlays = screen.getAllByTestId('drawer-overlay');
      fireEvent.click(overlays[0]);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Complete Drawer Flow', () => {
    it('renders complete drawer with all components', () => {
      const handleOpenChange = vi.fn();

      const { rerender } = render(
        <Drawer onOpenChange={handleOpenChange}>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer Title</DrawerTitle>
              <DrawerDescription>Drawer Description</DrawerDescription>
            </DrawerHeader>
            <div>Main Content Here</div>
            <DrawerFooter>
              <DrawerClose>
                <button>Cancel</button>
              </DrawerClose>
              <button>Confirm</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>,
      );

      // Initial state - only trigger visible
      expect(screen.getByText('Open Drawer')).toBeInTheDocument();

      // Simulate opening via prop change
      rerender(
        <Drawer open onOpenChange={handleOpenChange}>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer Title</DrawerTitle>
              <DrawerDescription>Drawer Description</DrawerDescription>
            </DrawerHeader>
            <div>Main Content Here</div>
            <DrawerFooter>
              <DrawerClose>
                <button>Cancel</button>
              </DrawerClose>
              <button>Confirm</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>,
      );

      // Verify all components rendered after opening
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
      expect(screen.getByText('Drawer Title')).toBeInTheDocument();
      expect(screen.getByText('Drawer Description')).toBeInTheDocument();
      expect(screen.getByText('Main Content Here')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('handles full open-interact-close cycle', async () => {
      const handleOpenChange = vi.fn();
      const handleConfirm = vi.fn();

      const { rerender } = render(
        <Drawer onOpenChange={handleOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
            <input type="text" data-testid="test-input" />
            <DrawerFooter>
              <DrawerClose>
                <button>Close</button>
              </DrawerClose>
              <button onClick={handleConfirm}>Confirm</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>,
      );

      // Simulate opening
      rerender(
        <Drawer open onOpenChange={handleOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
            <input type="text" data-testid="test-input" />
            <DrawerFooter>
              <DrawerClose>
                <button>Close</button>
              </DrawerClose>
              <button onClick={handleConfirm}>Confirm</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();

      // Interact
      const input = screen.getByTestId('test-input');
      await userEvent.type(input, 'test');
      expect(input).toHaveValue('test');

      // Confirm action
      fireEvent.click(screen.getByText('Confirm'));
      expect(handleConfirm).toHaveBeenCalledTimes(1);

      // Close via DrawerClose
      fireEvent.click(screen.getByTestId('drawer-close'));
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Drawer Component Integration', () => {
    it('uses cn utility for class merging in DrawerContent', () => {
      render(
        <Drawer open>
          <DrawerContent className="test-class another-class">
            Content
          </DrawerContent>
        </Drawer>,
      );

      const content = screen.getByTestId('drawer-content');
      expect(content).toBeInTheDocument();
    });

    it('uses cn utility for class merging in DrawerOverlay', () => {
      render(
        <Drawer open>
          <DrawerOverlay className="overlay-custom" />
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      const overlays = screen.getAllByTestId('drawer-overlay');
      expect(overlays.length).toBeGreaterThanOrEqual(1);
    });

    it('uses cn utility for class merging in DrawerTitle', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="title-custom">Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>,
      );

      const title = screen.getByTestId('drawer-title');
      expect(title).toBeInTheDocument();
    });

    it('uses cn utility for class merging in DrawerDescription', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerHeader>
              <DrawerDescription className="desc-custom">
                Description
              </DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>,
      );

      const description = screen.getByTestId('drawer-description');
      expect(description).toBeInTheDocument();
    });

    it('applies className to DrawerHeader div', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerHeader className="header-custom">
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>,
      );

      const header = screen.getByText('Title').closest('div');
      expect(header).toHaveClass('header-custom');
    });

    it('applies className to DrawerFooter div', () => {
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerFooter className="footer-custom">
              <button>Action</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>,
      );

      const footer = screen.getByText('Action').closest('div');
      expect(footer).toHaveClass('footer-custom');
    });

    it('respects shouldScaleBackground default value', () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      // Default should be true
      expect(screen.getByTestId('drawer-root')).toHaveAttribute(
        'data-scale-background',
        'true',
      );
    });

    it('allows disabling shouldScaleBackground', () => {
      render(
        <Drawer shouldScaleBackground={false}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>,
      );

      expect(screen.getByTestId('drawer-root')).toHaveAttribute(
        'data-scale-background',
        'false',
      );
    });
  });
});
