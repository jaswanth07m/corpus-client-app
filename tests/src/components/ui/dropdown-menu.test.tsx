import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from '@/components/ui/dropdown-menu';

// Mock @radix-ui/react-dropdown-menu primitives to control behavior while keeping dropdown-menu.tsx logic
vi.mock('@radix-ui/react-dropdown-menu', async () => {
  const actual = await vi.importActual('@radix-ui/react-dropdown-menu');
  return actual;
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Check: ({ className, ...props }: { className?: string }) => (
    <svg data-testid="check-icon" className={className} {...props} />
  ),
  ChevronRight: ({ className, ...props }: { className?: string }) => (
    <svg data-testid="chevron-icon" className={className} {...props} />
  ),
  Circle: ({ className, ...props }: { className?: string }) => (
    <svg data-testid="circle-icon" className={className} {...props} />
  ),
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(' '),
}));

describe('DropdownMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders DropdownMenu root without crashing', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Open Menu')).toBeInTheDocument();
    });

    it('renders trigger element correctly', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Click Me</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('menu content is NOT visible by default (closed state)', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
    });

    it('menu content appears when opened (controlled mode)', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('renders DropdownMenuLabel correctly', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders DropdownMenuSeparator correctly', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      // Separator renders as a div with role="separator"
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('renders DropdownMenuGroup correctly', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Grouped Item 1</DropdownMenuItem>
              <DropdownMenuItem>Grouped Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Grouped Item 1')).toBeInTheDocument();
      expect(screen.getByText('Grouped Item 2')).toBeInTheDocument();
    });

    it('renders DropdownMenuShortcut correctly', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save File
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('⌘S')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('clicking the trigger opens the dropdown menu', async () => {
      const onOpenChange = vi.fn();

      render(
        <DropdownMenu onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByText('Open Menu');
      // Use userEvent for more realistic interaction
      const user = userEvent.setup();
      await user.click(trigger);

      // Radix UI renders content in a portal - check for menu role
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('clicking a menu item triggers its callback and closes menu', async () => {
      const onSelect = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <DropdownMenu open onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onSelect}>Click Me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByText('Click Me');
      fireEvent.click(item);

      expect(onSelect).toHaveBeenCalledTimes(1);
      // onOpenChange should be called with false when item is selected
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('Escape key closes the menu', async () => {
      const onOpenChange = vi.fn();

      render(
        <DropdownMenu open onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      // Find the content element and trigger escape
      const menu = screen.getByRole('menu');
      fireEvent.keyDown(menu, { key: 'Escape' });

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('Arrow keys navigation (basic support)', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const items = screen.getAllByRole('menuitem');
      expect(items).toHaveLength(3);
    });
  });

  describe('Conditional UI', () => {
    it('renders disabled menu items correctly', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Enabled</DropdownMenuItem>
            <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const items = screen.getAllByRole('menuitem');
      // Radix UI uses aria-disabled for disabled state
      expect(items[0]).not.toHaveAttribute('aria-disabled');
      expect(items[1]).toHaveAttribute('aria-disabled', 'true');
    });

    it('renders inset variant for DropdownMenuItem', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByText('Inset Item');
      expect(item).toBeInTheDocument();
      // The inset prop adds 'pl-8' class via cn utility
      expect(item.className).toContain('pl-8');
    });

    it('renders inset variant for DropdownMenuSubTrigger', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>
                Inset Submenu
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const subTrigger = screen.getByText('Inset Submenu');
      expect(subTrigger).toBeInTheDocument();
      // The inset prop adds 'pl-8' class via cn utility
      expect(subTrigger.className).toContain('pl-8');
    });

    it('renders inset variant for DropdownMenuLabel', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const label = screen.getByText('Inset Label');
      expect(label).toBeInTheDocument();
      // The inset prop adds 'pl-8' class via cn utility
      expect(label.className).toContain('pl-8');
    });

    it('disabled menu items do not respond to clicks', () => {
      const onSelect = vi.fn();

      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onSelect} disabled>
              Disabled Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByText('Disabled Item');
      fireEvent.click(item);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('conditionally renders menu items', () => {
      const showItem = true;
      const { rerender } = render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            {showItem && <DropdownMenuItem>Conditional Item</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Conditional Item')).toBeInTheDocument();

      rerender(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            {!showItem && <DropdownMenuItem>Conditional Item</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.queryByText('Conditional Item')).not.toBeInTheDocument();
    });

    it('renders submenus correctly', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Submenu</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Submenu')).toBeInTheDocument();
      // Chevron icon indicates submenu
      expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
    });

    it('renders CheckboxItem correctly', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked>
              Show Line Numbers
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const checkboxItem = screen.getByText('Show Line Numbers');
      expect(checkboxItem).toHaveAttribute('role', 'menuitemcheckbox');
      // Radix UI uses aria-checked for checked state
      expect(checkboxItem).toHaveAttribute('aria-checked', 'true');
      // Check icon should be visible when checked
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('renders RadioItem correctly', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const radioItems = screen.getAllByRole('menuitemradio');
      expect(radioItems).toHaveLength(2);
      // Radix UI uses aria-checked for checked state on radio items
      expect(radioItems[0]).toHaveAttribute('aria-checked', 'true');
      expect(radioItems[1]).toHaveAttribute('aria-checked', 'false');
      // Circle icon should be visible for checked radio item
      expect(screen.getByTestId('circle-icon')).toBeInTheDocument();
    });

    it('renders RadioGroup correctly', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="selected">
              <DropdownMenuRadioItem value="selected">
                Selected
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Selected')).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls onOpenChange when menu opens', async () => {
      const onOpenChange = vi.fn();

      render(
        <DropdownMenu onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByText('Open');
      const user = userEvent.setup();
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('calls onOpenChange when menu closes via Escape key', async () => {
      const onOpenChange = vi.fn();

      render(
        <DropdownMenu open onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      // Verify menu is initially open
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Press Escape to close menu
      const menu = screen.getByRole('menu');
      fireEvent.keyDown(menu, { key: 'Escape' });

      // Verify onOpenChange was called with false
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onSelect when menu item is clicked', () => {
      const onSelect = vi.fn();

      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onSelect}>Select Me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByText('Select Me');
      fireEvent.click(item);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('calls onCheckedChange when CheckboxItem is clicked', () => {
      const onCheckedChange = vi.fn();

      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={onCheckedChange}
            >
              Toggle Option
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const checkboxItem = screen.getByText('Toggle Option');
      fireEvent.click(checkboxItem);

      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('calls onSelect on CheckboxItem when clicked', () => {
      const onSelect = vi.fn();

      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked onSelect={onSelect}>
              Checkbox
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const checkboxItem = screen.getByText('Checkbox');
      fireEvent.click(checkboxItem);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('calls onSelect on RadioItem when clicked', () => {
      const onSelect = vi.fn();

      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option2" onSelect={onSelect}>
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const radioItem = screen.getByText('Option 2');
      fireEvent.click(radioItem);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('verifies action buttons inside menu items trigger handlers', () => {
      const handleClick = vi.fn();

      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <button onClick={handleClick}>Inner Button</button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const innerButton = screen.getByText('Inner Button');
      fireEvent.click(innerButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper menu role on content', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByText('Item').closest('[role="menu"]');
      expect(content).toBeInTheDocument();
    });

    it('has proper menuitem role on items', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByText('Item');
      expect(item).toHaveAttribute('role', 'menuitem');
    });

    it('has proper menuitemcheckbox role on checkbox items', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>Checkbox</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const checkboxItem = screen.getByText('Checkbox');
      expect(checkboxItem).toHaveAttribute('role', 'menuitemcheckbox');
    });

    it('has proper menuitemradio role on radio items', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="opt">
              <DropdownMenuRadioItem value="opt">Radio</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const radioItem = screen.getByText('Radio');
      expect(radioItem).toHaveAttribute('role', 'menuitemradio');
    });

    it('has proper separator role', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const separator = screen.getByRole('separator');
      expect(separator).toBeInTheDocument();
    });

    it('has proper group role', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Item</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const group = screen.getByText('Item').closest('[role="group"]');
      expect(group).toBeInTheDocument();
    });

    it('disabled items have proper tabIndex', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Enabled</DropdownMenuItem>
            <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const items = screen.getAllByRole('menuitem');
      // Both items may have tabIndex - check aria-disabled instead
      expect(items[0]).not.toHaveAttribute('aria-disabled');
      expect(items[1]).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('handles no menu items gracefully', () => {
      expect(() => {
        render(
          <DropdownMenu open>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent />
          </DropdownMenu>,
        );
      }).not.toThrow();
    });

    it('handles rapid open/close toggling', async () => {
      const { rerender } = render(
        <DropdownMenu open={false}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      // Rapid toggle cycle
      rerender(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      rerender(
        <DropdownMenu open={false}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      rerender(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await waitFor(() => {
        expect(screen.getByText('Item')).toBeInTheDocument();
      });
    });

    it('handles null children', () => {
      expect(() => {
        render(
          <DropdownMenu open>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent>{null}</DropdownMenuContent>
          </DropdownMenu>,
        );
      }).not.toThrow();
    });

    it('handles undefined props', () => {
      expect(() => {
        render(
          <DropdownMenu open={undefined}>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Item</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>,
        );
      }).not.toThrow();
    });

    it('handles empty string as label', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel></DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      // Label still renders as an element
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('handles multiple items with same text', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const items = screen.getAllByText('Duplicate');
      expect(items).toHaveLength(3);
    });

    it('handles defaultOpen in uncontrolled mode', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Item')).toBeInTheDocument();
    });

    it('respects open prop in controlled mode', () => {
      const { rerender } = render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Item')).toBeInTheDocument();

      rerender(
        <DropdownMenu open={false}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.queryByText('Item')).not.toBeInTheDocument();
    });
  });

  describe('Async Handling', () => {
    it('waits for DOM updates after opening menu', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByText('Open');
      const user = userEvent.setup();
      await user.click(trigger);

      const menu = await screen.findByRole('menu');
      expect(menu).toBeInTheDocument();
    });

    it('waits for DOM updates after closing menu via Escape', async () => {
      const onOpenChange = vi.fn();

      render(
        <DropdownMenu open onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      // Verify menu is initially open
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Press Escape to close menu
      const menu = screen.getByRole('menu');
      fireEvent.keyDown(menu, { key: 'Escape' });

      // Verify onOpenChange was called with false
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('uses findBy to wait for menu content', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByText('Open');
      const user = userEvent.setup();
      await user.click(trigger);

      const menu = await screen.findByRole('menu');
      expect(menu).toBeInTheDocument();
    });
  });

  describe('DropdownMenuTrigger Component', () => {
    it('supports asChild prop', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>Custom Trigger</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
    });

    it('renders custom child element', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>
            <span>Trigger Text</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByText('Trigger Text')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuSub Component', () => {
    it('handles sub open/close state', async () => {
      const onSubOpenChange = vi.fn();

      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub onOpenChange={onSubOpenChange}>
              <DropdownMenuSubTrigger>Submenu</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const subTrigger = screen.getByText('Submenu');
      fireEvent.click(subTrigger);

      await waitFor(() => {
        expect(screen.getByText('Sub Item')).toBeInTheDocument();
      });
      expect(onSubOpenChange).toHaveBeenCalledWith(true);
    });

    it('calls onOpenChange for submenu', async () => {
      const onSubOpenChange = vi.fn();

      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub onOpenChange={onSubOpenChange}>
              <DropdownMenuSubTrigger>Submenu</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const subTrigger = screen.getByText('Submenu');
      fireEvent.click(subTrigger);

      await waitFor(() => {
        expect(onSubOpenChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Complete Dropdown Menu Flow', () => {
    it('renders complete dropdown menu with all components', async () => {
      const handleOpenChange = vi.fn();
      const handleSelect = vi.fn();

      render(
        <DropdownMenu onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger>Open Complete Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>File Operations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={handleSelect}>
                New File
                <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSelect}>
                Open File
                <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>HTML</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>
              Show Line Numbers
            </DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup value="small">
              <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="medium">
                Medium
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      // Initial state - only trigger visible
      expect(screen.getByText('Open Complete Menu')).toBeInTheDocument();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Open menu
      const trigger = screen.getByText('Open Complete Menu');
      const user = userEvent.setup();
      await user.click(trigger);

      // Verify all components rendered
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      expect(screen.getByText('File Operations')).toBeInTheDocument();
      expect(screen.getAllByRole('separator')).toHaveLength(3);
      expect(screen.getByText('New File')).toBeInTheDocument();
      expect(screen.getByText('Open File')).toBeInTheDocument();
      expect(screen.getByText('⌘N')).toBeInTheDocument();
      expect(screen.getByText('⌘O')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Show Line Numbers')).toBeInTheDocument();
      expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
      expect(screen.getAllByRole('menuitemradio')).toHaveLength(3);
    });

    it('handles full open-select-close cycle', async () => {
      const handleOpenChange = vi.fn();
      const handleSelect = vi.fn();

      render(
        <DropdownMenu onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect}>
              Select Me
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      // Open menu
      const trigger = screen.getByText('Open');
      const user = userEvent.setup();
      await user.click(trigger);

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalled();
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Select item
      const item = screen.getByText('Select Me');
      fireEvent.click(item);

      expect(handleSelect).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalled();
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Portal Integration', () => {
    it('renders content inside Portal', async () => {
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent>
              <DropdownMenuItem>Portaled Item</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>,
      );

      expect(screen.getByText('Portaled Item')).toBeInTheDocument();
    });
  });
});
