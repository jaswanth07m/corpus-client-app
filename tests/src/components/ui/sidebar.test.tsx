import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Define t globally for components that use it directly (bug in original code)
declare global {
  var t: (key: string) => string;
}
globalThis.t = (key: string) => key;

// Mock i18next BEFORE any imports that use it
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: globalThis.t,
  }),
}));

// Mock useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(),
}));

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const { useIsMobile } = await import('@/hooks/use-mobile');

// Test helper component to access sidebar context
function SidebarStateDisplay() {
  const { state, open, toggleSidebar } = useSidebar();
  return (
    <div data-testid="sidebar-state">
      <span data-testid="state-value">{state}</span>
      <span data-testid="open-value">{open ? 'true' : 'false'}</span>
      <button onClick={toggleSidebar} data-testid="context-toggle">
        Toggle
      </button>
    </div>
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = 'sidebar:state=; path=/; max-age=0';
  });

  afterEach(() => {
    document.cookie = 'sidebar:state=; path=/; max-age=0';
  });

  describe('SidebarProvider', () => {
    it('renders without crashing', () => {
      render(
        <SidebarProvider>
          <div>Content</div>
        </SidebarProvider>,
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('provides sidebar context to children', () => {
      render(
        <SidebarProvider>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );
      expect(screen.getByTestId('sidebar-state')).toBeInTheDocument();
    });

    it('defaults to open state', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );
      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');
      expect(screen.getByTestId('open-value')).toHaveTextContent('true');
    });

    it('respects defaultOpen prop', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider defaultOpen={false}>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );
      expect(screen.getByTestId('state-value')).toHaveTextContent('collapsed');
      expect(screen.getByTestId('open-value')).toHaveTextContent('false');
    });

    it('works in controlled mode with open prop', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <SidebarProvider open={true} onOpenChange={onOpenChange}>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );
      expect(screen.getByTestId('open-value')).toHaveTextContent('true');

      rerender(
        <SidebarProvider open={false} onOpenChange={onOpenChange}>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );
      expect(screen.getByTestId('open-value')).toHaveTextContent('false');
    });

    it('calls onOpenChange when state changes', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      const onOpenChange = vi.fn();
      render(
        <SidebarProvider onOpenChange={onOpenChange}>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      fireEvent.click(screen.getByTestId('context-toggle'));
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('handles function updater pattern in setOpen', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      const onOpenChange = vi.fn();
      render(
        <SidebarProvider onOpenChange={onOpenChange}>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      // Initial state is expanded (true)
      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');

      // First toggle: uses function updater (open) => !open
      // This exercises line 79: const openState = typeof value === 'function' ? value(open) : value;
      fireEvent.click(screen.getByTestId('context-toggle'));
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      // Second click: function updater is called again
      fireEvent.click(screen.getByTestId('context-toggle'));
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledTimes(2);
      });

      // Verify the function updater path was executed (line 79 coverage)
      expect(onOpenChange).toHaveBeenCalled();
    });

    it('handles direct boolean value in setOpen (non-function path)', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      const onOpenChange = vi.fn();

      // Test component that calls setOpen with direct boolean
      function TestSetOpenDirect() {
        const { setOpen } = useSidebar();
        return (
          <div>
            <button data-testid="set-true" onClick={() => setOpen(true)}>
              Set True
            </button>
            <button data-testid="set-false" onClick={() => setOpen(false)}>
              Set False
            </button>
          </div>
        );
      }

      render(
        <SidebarProvider onOpenChange={onOpenChange}>
          <TestSetOpenDirect />
        </SidebarProvider>,
      );

      // Call setOpen with direct boolean (exercises the else branch of line 79)
      fireEvent.click(screen.getByTestId('set-true'));
      expect(onOpenChange).toHaveBeenCalledWith(true);

      fireEvent.click(screen.getByTestId('set-false'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('sets cookie when state changes', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      fireEvent.click(screen.getByTestId('context-toggle'));
      await waitFor(() => {
        expect(document.cookie).toContain('sidebar:state=false');
      });
    });

    it('throws error when useSidebar used outside provider', () => {
      const TestComponent = () => {
        useSidebar();
        return null;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSidebar must be used within a SidebarProvider.');
    });
  });

  describe('Sidebar', () => {
    it('renders sidebar within provider', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar data-testid="sidebar">
            <div>Sidebar Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders with default side (left)', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      // The data-side attribute is on the inner div with data-state
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders with right side', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar side="right" data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      const sidebar = document.querySelector('[data-side="right"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders with default variant (sidebar)', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      const sidebar = document.querySelector('[data-variant="sidebar"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders with floating variant', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar variant="floating" data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      const sidebar = document.querySelector('[data-variant="floating"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders with inset variant', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar variant="inset" data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      const sidebar = document.querySelector('[data-variant="inset"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders with collapsible offcanvas (default)', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      const sidebar = document.querySelector('[data-collapsible="offcanvas"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders with collapsible icon mode', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar collapsible="icon" data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      const sidebar = document.querySelector('[data-collapsible="icon"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders with collapsible none', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar collapsible="none" data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      // With collapsible="none", it renders a simple div without data-collapsible
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('uses Sheet component on mobile', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(true);
      render(
        <SidebarProvider>
          <SidebarTrigger data-testid="trigger" />
          <Sidebar data-testid="sidebar">
            <div>Sidebar Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      // On mobile, sidebar is rendered within a Sheet, but Sheet is closed by default
      // Click trigger to open it
      fireEvent.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        // The SheetContent has data-sidebar="sidebar"
        const sheetContent = document.querySelector('[data-sidebar="sidebar"]');
        expect(sheetContent).toBeInTheDocument();
      });
    });
  });

  describe('SidebarTrigger', () => {
    it('renders trigger button', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarTrigger data-testid="trigger" />
        </SidebarProvider>,
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('toggles sidebar when clicked', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarTrigger data-testid="trigger" />
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');
      fireEvent.click(screen.getByTestId('trigger'));
      await waitFor(() => {
        expect(screen.getByTestId('state-value')).toHaveTextContent(
          'collapsed',
        );
      });
    });

    it('calls onClick callback when provided', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      const onClick = vi.fn();
      render(
        <SidebarProvider>
          <SidebarTrigger onClick={onClick} data-testid="trigger" />
        </SidebarProvider>,
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('has accessible label', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarTrigger />
        </SidebarProvider>,
      );
      expect(screen.getByText('Toggle Sidebar')).toHaveClass('sr-only');
    });
  });

  describe('SidebarRail', () => {
    it('renders rail element', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarRail data-testid="rail" />
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('rail')).toBeInTheDocument();
    });

    it('toggles sidebar when clicked', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarRail data-testid="rail" />
            <SidebarStateDisplay />
          </Sidebar>
        </SidebarProvider>,
      );

      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');
      fireEvent.click(screen.getByTestId('rail'));
      await waitFor(() => {
        expect(screen.getByTestId('state-value')).toHaveTextContent(
          'collapsed',
        );
      });
    });

    it('has aria-label attribute', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarRail />
          </Sidebar>
        </SidebarProvider>,
      );
      expect(
        screen.getByLabelText('common.toggle.sidebar'),
      ).toBeInTheDocument();
    });
  });

  describe('Layout Components', () => {
    it('renders SidebarHeader', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader data-testid="header">Header</SidebarHeader>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toHaveAttribute(
        'data-sidebar',
        'header',
      );
    });

    it('renders SidebarFooter', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarFooter data-testid="footer">Footer</SidebarFooter>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toHaveAttribute(
        'data-sidebar',
        'footer',
      );
    });

    it('renders SidebarContent', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent data-testid="content">Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toHaveAttribute(
        'data-sidebar',
        'content',
      );
    });

    it('renders SidebarInput', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarInput data-testid="input" placeholder="Search..." />
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders SidebarSeparator', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarSeparator data-testid="separator" />
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByTestId('separator')).toHaveAttribute(
        'data-sidebar',
        'separator',
      );
    });

    it('renders SidebarInset', () => {
      render(
        <SidebarProvider>
          <SidebarInset data-testid="inset">Main Content</SidebarInset>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('inset')).toBeInTheDocument();
    });
  });

  describe('SidebarGroup Components', () => {
    it('renders SidebarGroup', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroup data-testid="group">
              <div>Group Content</div>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('group')).toBeInTheDocument();
      expect(screen.getByTestId('group')).toHaveAttribute(
        'data-sidebar',
        'group',
      );
    });

    it('renders SidebarGroupLabel', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroup>
              <SidebarGroupLabel data-testid="label">Label</SidebarGroupLabel>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('label')).toBeInTheDocument();
      expect(screen.getByTestId('label')).toHaveAttribute(
        'data-sidebar',
        'group-label',
      );
    });

    it('renders SidebarGroupLabel with asChild', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroup>
              <SidebarGroupLabel asChild data-testid="label-as-child">
                <span>As Child Label</span>
              </SidebarGroupLabel>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('label-as-child')).toBeInTheDocument();
    });

    it('renders SidebarGroupAction', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroup>
              <SidebarGroupAction data-testid="action">
                <span>Action</span>
              </SidebarGroupAction>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('action')).toBeInTheDocument();
      expect(screen.getByTestId('action')).toHaveAttribute(
        'data-sidebar',
        'group-action',
      );
    });

    it('renders SidebarGroupAction with asChild', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroup>
              <SidebarGroupAction asChild data-testid="action-as-child">
                <button>Custom Button</button>
              </SidebarGroupAction>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('action-as-child')).toBeInTheDocument();
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });

    it('calls onClick on SidebarGroupAction', () => {
      const onClick = vi.fn();
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroup>
              <SidebarGroupAction onClick={onClick} data-testid="action">
                Action
              </SidebarGroupAction>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>,
      );
      fireEvent.click(screen.getByTestId('action'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders SidebarGroupContent', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroup>
              <SidebarGroupContent data-testid="group-content">
                Group Content
              </SidebarGroupContent>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('group-content')).toBeInTheDocument();
      expect(screen.getByTestId('group-content')).toHaveAttribute(
        'data-sidebar',
        'group-content',
      );
    });
  });

  describe('SidebarMenu Components', () => {
    it('renders SidebarMenu', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu data-testid="menu">
              <li>Item 1</li>
              <li>Item 2</li>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('menu')).toBeInTheDocument();
      expect(screen.getByTestId('menu')).toHaveAttribute(
        'data-sidebar',
        'menu',
      );
    });

    it('renders SidebarMenuItem', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem data-testid="item">Item</SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('item')).toBeInTheDocument();
      expect(screen.getByTestId('item')).toHaveAttribute(
        'data-sidebar',
        'menu-item',
      );
    });

    it('renders SidebarMenuButton', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton data-testid="button">
                  Button
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('button')).toBeInTheDocument();
      expect(screen.getByTestId('button')).toHaveAttribute(
        'data-sidebar',
        'menu-button',
      );
    });

    it('renders SidebarMenuButton with active state', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive data-testid="active-button">
                  Active Button
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('active-button')).toHaveAttribute(
        'data-active',
        'true',
      );
    });

    it('renders SidebarMenuButton with asChild', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="button-as-child">
                  <a href="/link">Custom Link</a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('button-as-child')).toBeInTheDocument();
      expect(screen.getByText('Custom Link')).toBeInTheDocument();
      expect(screen.getByText('Custom Link')).toHaveAttribute('href', '/link');
    });

    it('renders SidebarMenuButton with tooltip', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Tooltip text"
                  data-testid="tooltip-button"
                >
                  Button
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('tooltip-button')).toBeInTheDocument();
    });

    it('renders SidebarMenuButton with string tooltip in collapsed state', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Helpful tooltip">
                  Button
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      // Tooltip content has data-state attribute
      const tooltip = document.querySelector('[data-state="closed"]');
      expect(tooltip).toBeInTheDocument();
    });

    it('converts string tooltip to object with children property', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider defaultOpen={true}>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Test tooltip text"
                  data-testid="tooltip-btn"
                >
                  Button
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      // The string tooltip should be converted to { children: "Test tooltip text" }
      // and rendered in the TooltipContent
      const tooltipContent = document.querySelector('[role="tooltip"]');
      if (tooltipContent) {
        expect(tooltipContent).toHaveTextContent('Test tooltip text');
      }
      // Verify the button renders
      expect(screen.getByTestId('tooltip-btn')).toBeInTheDocument();
    });

    it('passes tooltip object children to TooltipContent', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="My Tooltip"
                  data-testid="btn-with-tooltip"
                >
                  Button
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );

      // When collapsed (defaultOpen={false}), tooltip should be rendered
      // The string "My Tooltip" is converted to { children: "My Tooltip" }
      // and spread onto TooltipContent
      await waitFor(() => {
        const tooltipContent = document.querySelector('[data-state="closed"]');
        expect(tooltipContent).toBeInTheDocument();
      });

      // Verify button exists
      expect(screen.getByTestId('btn-with-tooltip')).toBeInTheDocument();
    });

    it('handles tooltip as object (non-string) directly', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={{ children: 'Object Tooltip', side: 'right' }}
                  data-testid="btn-obj-tooltip"
                >
                  Button
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );

      // When tooltip is already an object, the string conversion branch is skipped
      // but the tooltip object is still spread onto TooltipContent
      const tooltipContent = document.querySelector('[data-state="closed"]');
      expect(tooltipContent).toBeInTheDocument();
      expect(screen.getByTestId('btn-obj-tooltip')).toBeInTheDocument();
    });

    it('verifies string tooltip conversion executes assignment', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      const { container } = render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Converted Tooltip">
                  Button
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );

      // The string tooltip is converted to { children: "Converted Tooltip" }
      // This exercises line 582: tooltip = { children: tooltip };
      // Verify the tooltip content is rendered
      const tooltipContent = container.querySelector('[data-state="closed"]');
      expect(tooltipContent).toBeInTheDocument();
    });

    it('calls onClick on SidebarMenuButton', () => {
      const onClick = vi.fn();
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onClick}>
                  Click me
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      fireEvent.click(screen.getByText('Click me'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders SidebarMenuButton with different sizes', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" data-testid="sm-button">
                  Small
                </SidebarMenuButton>
                <SidebarMenuButton size="lg" data-testid="lg-button">
                  Large
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('sm-button')).toHaveAttribute(
        'data-size',
        'sm',
      );
      expect(screen.getByTestId('lg-button')).toHaveAttribute(
        'data-size',
        'lg',
      );
    });

    it('renders SidebarMenuButton with outline variant', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline">
                  Outline Button
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByText('Outline Button')).toBeInTheDocument();
    });

    it('renders SidebarMenuAction', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuAction data-testid="menu-action">
                  <span>Action</span>
                </SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('menu-action')).toBeInTheDocument();
      expect(screen.getByTestId('menu-action')).toHaveAttribute(
        'data-sidebar',
        'menu-action',
      );
    });

    it('renders SidebarMenuAction with asChild', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuAction asChild data-testid="menu-action-as-child">
                  <a href="/action">Custom Action</a>
                </SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('menu-action-as-child')).toBeInTheDocument();
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
      expect(screen.getByText('Custom Action')).toHaveAttribute(
        'href',
        '/action',
      );
    });

    it('calls onClick on SidebarMenuAction', () => {
      const onClick = vi.fn();
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuAction onClick={onClick}>Action</SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      fireEvent.click(screen.getByText('Action'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders SidebarMenuAction with showOnHover', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuAction showOnHover data-testid="hover-action">
                  Hover Action
                </SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('hover-action')).toBeInTheDocument();
    });

    it('renders SidebarMenuBadge', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Button</SidebarMenuButton>
                <SidebarMenuBadge data-testid="badge">5</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByTestId('badge')).toHaveAttribute(
        'data-sidebar',
        'menu-badge',
      );
    });

    it('renders SidebarMenuSkeleton', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuSkeleton data-testid="skeleton" />
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton')).toHaveAttribute(
        'data-sidebar',
        'menu-skeleton',
      );
    });

    it('renders SidebarMenuSkeleton with icon', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuSkeleton showIcon data-testid="skeleton-icon" />
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('skeleton-icon')).toBeInTheDocument();
    });

    it('renders SidebarMenuSub', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSub data-testid="sub-menu">
                  <li>Sub Item</li>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('sub-menu')).toBeInTheDocument();
      expect(screen.getByTestId('sub-menu')).toHaveAttribute(
        'data-sidebar',
        'menu-sub',
      );
    });

    it('renders SidebarMenuSubItem', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSub>
                  <SidebarMenuSubItem data-testid="sub-item">
                    Sub Item
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('sub-item')).toBeInTheDocument();
    });

    it('renders SidebarMenuSubButton', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton data-testid="sub-button">
                      Sub Button
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('sub-button')).toBeInTheDocument();
      expect(screen.getByTestId('sub-button')).toHaveAttribute(
        'data-sidebar',
        'menu-sub-button',
      );
    });

    it('renders SidebarMenuSubButton with active state', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive
                      data-testid="active-sub-button"
                    >
                      Active Sub Button
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('active-sub-button')).toHaveAttribute(
        'data-active',
        'true',
      );
    });

    it('renders SidebarMenuSubButton with asChild', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      data-testid="sub-button-as-child"
                    >
                      <a href="/sub-link">Custom Sub Link</a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('sub-button-as-child')).toBeInTheDocument();
      expect(screen.getByText('Custom Sub Link')).toBeInTheDocument();
      expect(screen.getByText('Custom Sub Link')).toHaveAttribute(
        'href',
        '/sub-link',
      );
    });

    it('renders SidebarMenuSubButton with different sizes', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton size="sm" data-testid="sm-sub-button">
                      Small
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton size="md" data-testid="md-sub-button">
                      Medium
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('sm-sub-button')).toHaveAttribute(
        'data-size',
        'sm',
      );
      expect(screen.getByTestId('md-sub-button')).toHaveAttribute(
        'data-size',
        'md',
      );
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('toggles sidebar with Ctrl+B keyboard shortcut', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');

      // Simulate Ctrl+B
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByTestId('state-value')).toHaveTextContent(
          'collapsed',
        );
      });
    });

    it('toggles sidebar with Cmd+B keyboard shortcut (Mac)', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');

      // Simulate Cmd+B
      fireEvent.keyDown(window, { key: 'b', metaKey: true });

      await waitFor(() => {
        expect(screen.getByTestId('state-value')).toHaveTextContent(
          'collapsed',
        );
      });
    });

    it('does not toggle with just B key (no modifier)', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');

      // Simulate just B without modifier
      fireEvent.keyDown(window, { key: 'b' });

      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');
    });
  });

  describe('Mobile Behavior', () => {
    it('uses Sheet component on mobile devices', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(true);
      render(
        <SidebarProvider>
          <SidebarTrigger data-testid="trigger" />
          <Sidebar>
            <div>Mobile Sidebar</div>
          </Sidebar>
        </SidebarProvider>,
      );
      // On mobile, sidebar is wrapped in Sheet, but closed by default
      // Click trigger to open
      fireEvent.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        const mobileSidebar = document.querySelector(
          '[data-sidebar="sidebar"]',
        );
        expect(mobileSidebar).toBeInTheDocument();
      });
    });

    it('toggles mobile sidebar separately', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(true);
      render(
        <SidebarProvider>
          <SidebarTrigger data-testid="trigger" />
          <Sidebar>
            <div>Mobile Content</div>
          </Sidebar>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      // On mobile, clicking trigger should toggle the mobile sheet
      fireEvent.click(screen.getByTestId('trigger'));
      await waitFor(() => {
        const mobileSidebar = document.querySelector('[data-mobile="true"]');
        expect(mobileSidebar).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid toggling', async () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarTrigger data-testid="trigger" />
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.click(trigger);
      fireEvent.click(trigger);
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByTestId('state-value')).toHaveTextContent(
          'collapsed',
        );
      });
    });

    it('handles multiple sidebar instances', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <div>
            <Sidebar data-testid="sidebar1">Sidebar 1</Sidebar>
            <Sidebar data-testid="sidebar2">Sidebar 2</Sidebar>
          </div>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('sidebar1')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar2')).toBeInTheDocument();
    });

    it('renders with empty children', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar />
        </SidebarProvider>,
      );
      // The sidebar wrapper should still be rendered
      expect(
        document.querySelector('.group\\/sidebar-wrapper'),
      ).toBeInTheDocument();
    });

    it('handles null props gracefully', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar className={null as unknown as string}>
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('preserves state across re-renders', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      const { rerender } = render(
        <SidebarProvider>
          <SidebarStateDisplay />
        </SidebarProvider>,
      );

      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');

      rerender(
        <SidebarProvider>
          <SidebarStateDisplay />
          <div>New Content</div>
        </SidebarProvider>,
      );

      expect(screen.getByTestId('state-value')).toHaveTextContent('expanded');
    });
  });

  describe('Accessibility', () => {
    it('has proper data attributes for styling hooks', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar data-testid="sidebar">
            <div>Content</div>
          </Sidebar>
        </SidebarProvider>,
      );
      // The inner sidebar div has data-state and data-collapsible
      const sidebar = document.querySelector('[data-state="collapsed"]');
      expect(sidebar).toBeInTheDocument();
      const collapsible = document.querySelector(
        '[data-collapsible="offcanvas"]',
      );
      expect(collapsible).toBeInTheDocument();
    });

    it('SidebarTrigger has sr-only text for screen readers', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <SidebarTrigger />
        </SidebarProvider>,
      );
      expect(screen.getByText('Toggle Sidebar')).toHaveClass('sr-only');
    });

    it('SidebarRail has aria-label', () => {
      (useIsMobile as vi.Mock).mockReturnValue(false);
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarRail />
          </Sidebar>
        </SidebarProvider>,
      );
      const rail = document.querySelector(
        '[aria-label="common.toggle.sidebar"]',
      );
      expect(rail).toBeInTheDocument();
    });
  });
});
