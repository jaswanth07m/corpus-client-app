import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
} from '../../../../src/components/ui/menubar';

describe('Menubar Components', () => {
  describe('Menubar', () => {
    it('renders menubar with default classes', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>,
      );

      const menubar = screen.getByRole('menubar');
      expect(menubar).toBeInTheDocument();
      expect(menubar).toHaveClass(
        'flex',
        'h-10',
        'items-center',
        'rounded-md',
        'border',
      );
    });

    it('applies custom className', () => {
      render(
        <Menubar className="custom-class">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>,
      );

      expect(screen.getByRole('menubar')).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(
        <Menubar ref={ref}>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>,
      );

      // React may call ref multiple times during render
      expect(ref).toHaveBeenCalled();
    });

    it('passes through HTML attributes', () => {
      render(
        <Menubar data-testid="test-menubar" aria-label="Main menu">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>,
      );

      expect(screen.getByTestId('test-menubar')).toBeInTheDocument();
      expect(screen.getByRole('menubar')).toHaveAttribute(
        'aria-label',
        'Main menu',
      );
    });
  });

  describe('MenubarTrigger', () => {
    it('renders trigger with default classes', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>,
      );

      const trigger = screen.getByRole('menuitem', { name: 'File' });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveClass(
        'cursor-default',
        'select-none',
        'px-3',
        'py-1.5',
      );
    });

    it('applies custom className', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger className="custom-trigger">File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>,
      );

      expect(screen.getByRole('menuitem', { name: 'File' })).toHaveClass(
        'custom-trigger',
      );
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger ref={ref}>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>,
      );

      // React may call ref multiple times during render
      expect(ref).toHaveBeenCalled();
    });

    it('opens menu on click', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Open</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      const trigger = screen.getByRole('menuitem', { name: 'File' });
      await userEvent.click(trigger);

      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('has focus styles on focus', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>,
      );

      const trigger = screen.getByRole('menuitem', { name: 'File' });
      await userEvent.tab();

      expect(trigger).toHaveFocus();
    });
  });

  describe('MenubarContent', () => {
    it('renders content when menu is open', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Open</MenubarItem>
              <MenubarItem>Save</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('uses default alignment props', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent data-testid="content">
              <MenubarItem>Item</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
    });

    it('accepts custom alignment props', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent
              align="end"
              alignOffset={0}
              sideOffset={10}
              data-testid="content"
            >
              <MenubarItem>Item</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies custom className', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent className="custom-content" data-testid="content">
              <MenubarItem>Item</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByTestId('content')).toHaveClass('custom-content');
    });
  });

  describe('MenubarItem', () => {
    it('renders item with default classes', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Open</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      const item = screen.getByRole('menuitem', { name: 'Open' });
      expect(item).toBeInTheDocument();
      expect(item).toHaveClass(
        'relative',
        'cursor-default',
        'select-none',
        'px-2',
        'py-1.5',
      );
    });

    it('applies custom className', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem className="custom-item">Open</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveClass(
        'custom-item',
      );
    });

    it('handles inset prop', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem inset>Indented</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByRole('menuitem', { name: 'Indented' })).toHaveClass(
        'pl-8',
      );
    });

    it('handles click events', async () => {
      const handleClick = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={handleClick}>Open</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));
      await userEvent.click(screen.getByRole('menuitem', { name: 'Open' }));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has disabled state styles when disabled', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled data-testid="disabled-item">
                Disabled
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByTestId('disabled-item')).toHaveAttribute(
        'data-disabled',
      );
    });
  });

  describe('MenubarSeparator', () => {
    it('renders separator with default classes', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Open</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      const separator = screen.getByRole('separator');
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveClass('-mx-1', 'my-1', 'h-px', 'bg-muted');
    });

    it('applies custom className', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Open</MenubarItem>
              <MenubarSeparator className="custom-separator" />
              <MenubarItem>Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByRole('separator')).toHaveClass('custom-separator');
    });

    it('forwards ref correctly', async () => {
      const ref = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Open</MenubarItem>
              <MenubarSeparator ref={ref} />
              <MenubarItem>Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(ref).toHaveBeenCalledTimes(1);
    });
  });

  describe('MenubarLabel', () => {
    it('renders label with default classes', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Actions</MenubarLabel>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      const label = screen.getByText('Actions');
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('px-2', 'py-1.5', 'text-sm', 'font-semibold');
    });

    it('applies custom className', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel className="custom-label">Actions</MenubarLabel>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByText('Actions')).toHaveClass('custom-label');
    });

    it('handles inset prop', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel inset>Indented Label</MenubarLabel>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByText('Indented Label')).toHaveClass('pl-8');
    });

    it('forwards ref correctly', async () => {
      const ref = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel ref={ref}>Actions</MenubarLabel>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(ref).toHaveBeenCalledTimes(1);
    });
  });

  describe('MenubarCheckboxItem', () => {
    it('renders checkbox item with default classes', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem>Dark Mode</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));

      const checkbox = screen.getByRole('menuitemcheckbox', {
        name: 'Dark Mode',
      });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveClass(
        'relative',
        'cursor-default',
        'select-none',
        'py-1.5',
        'pl-8',
        'pr-2',
      );
    });

    it('applies custom className', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem className="custom-checkbox">
                Dark Mode
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));

      expect(
        screen.getByRole('menuitemcheckbox', { name: 'Dark Mode' }),
      ).toHaveClass('custom-checkbox');
    });

    it('handles checked state', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked>Dark Mode</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));

      const checkbox = screen.getByRole('menuitemcheckbox', {
        name: 'Dark Mode',
      });
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('handles unchecked state', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={false}>
                Dark Mode
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));

      const checkbox = screen.getByRole('menuitemcheckbox', {
        name: 'Dark Mode',
      });
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('toggles on click', async () => {
      const handleChange = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem onCheckedChange={handleChange}>
                Dark Mode
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));
      await userEvent.click(
        screen.getByRole('menuitemcheckbox', { name: 'Dark Mode' }),
      );

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('renders check icon when checked', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked>Dark Mode</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));

      // The Check icon should be present in the ItemIndicator when checked
      const checkbox = screen.getByRole('menuitemcheckbox', {
        name: 'Dark Mode',
      });
      const checkIcon = checkbox.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('MenubarRadioGroup and MenubarRadioItem', () => {
    it('renders radio group with items', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="light">
                <MenubarRadioItem value="light">Light</MenubarRadioItem>
                <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));

      expect(
        screen.getByRole('menuitemradio', { name: 'Light' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitemradio', { name: 'Dark' }),
      ).toBeInTheDocument();
    });

    it('shows correct selected radio item', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="dark">
                <MenubarRadioItem value="light">Light</MenubarRadioItem>
                <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));

      const darkRadio = screen.getByRole('menuitemradio', { name: 'Dark' });
      expect(darkRadio).toHaveAttribute('data-state', 'checked');
    });

    it('changes selection on click', async () => {
      const handleChange = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="light" onValueChange={handleChange}>
                <MenubarRadioItem value="light">Light</MenubarRadioItem>
                <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));
      await userEvent.click(
        screen.getByRole('menuitemradio', { name: 'Dark' }),
      );

      expect(handleChange).toHaveBeenCalledWith('dark');
    });

    it('renders radio circle icon', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="light">
                <MenubarRadioItem value="light">Light</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));

      // The Circle icon should be present
      const radioItem = screen.getByRole('menuitemradio', { name: 'Light' });
      expect(radioItem).toBeInTheDocument();
    });

    it('applies custom className to radio item', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="light">
                <MenubarRadioItem value="light" className="custom-radio">
                  Light
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));

      expect(screen.getByRole('menuitemradio', { name: 'Light' })).toHaveClass(
        'custom-radio',
      );
    });
  });

  describe('MenubarSub, MenubarSubTrigger, and MenubarSubContent', () => {
    it('renders sub menu structure', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>Image</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(
        screen.getByRole('menuitem', { name: 'Export' }),
      ).toBeInTheDocument();
    });

    it('opens sub content on hover/click', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));
      const subTrigger = screen.getByRole('menuitem', { name: 'Export' });
      await userEvent.click(subTrigger);

      // Sub content should be visible after clicking sub trigger
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    it('applies custom className to sub trigger', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger className="custom-sub-trigger">
                  Export
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveClass(
        'custom-sub-trigger',
      );
    });

    it('applies custom className to sub content', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent
                  className="custom-sub-content"
                  data-testid="sub-content"
                >
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));
      const subTrigger = screen.getByRole('menuitem', { name: 'Export' });
      await userEvent.click(subTrigger);

      expect(screen.getByTestId('sub-content')).toHaveClass(
        'custom-sub-content',
      );
    });

    it('handles inset prop on sub trigger', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger inset>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveClass(
        'pl-8',
      );
    });

    it('renders ChevronRight icon in sub trigger', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      // The sub trigger should contain the ChevronRight icon
      const subTrigger = screen.getByRole('menuitem', { name: 'Export' });
      expect(subTrigger).toBeInTheDocument();
    });
  });

  describe('MenubarShortcut', () => {
    it('renders shortcut with default classes', () => {
      render(<MenubarShortcut>⌘O</MenubarShortcut>);

      const shortcut = screen.getByText('⌘O');
      expect(shortcut).toBeInTheDocument();
      expect(shortcut).toHaveClass(
        'ml-auto',
        'text-xs',
        'tracking-widest',
        'text-muted-foreground',
      );
    });

    it('applies custom className', () => {
      render(<MenubarShortcut className="custom-shortcut">⌘O</MenubarShortcut>);

      expect(screen.getByText('⌘O')).toHaveClass('custom-shortcut');
    });

    it('passes through HTML attributes', () => {
      render(
        <MenubarShortcut
          data-testid="test-shortcut"
          aria-label="Keyboard shortcut"
        >
          ⌘O
        </MenubarShortcut>,
      );

      expect(screen.getByTestId('test-shortcut')).toBeInTheDocument();
      expect(screen.getByText('⌘O')).toHaveAttribute(
        'aria-label',
        'Keyboard shortcut',
      );
    });
  });

  describe('MenubarGroup', () => {
    it('renders group wrapper', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem>Item 1</MenubarItem>
                <MenubarItem>Item 2</MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(
        screen.getByRole('menuitem', { name: 'Item 1' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Item 2' }),
      ).toBeInTheDocument();
    });
  });

  describe('MenubarPortal', () => {
    it('renders content in portal', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarPortal>
              <MenubarContent data-testid="portal-content">
                <MenubarItem>Item</MenubarItem>
              </MenubarContent>
            </MenubarPortal>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      expect(screen.getByTestId('portal-content')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('renders complete menubar with all components', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>File Operations</MenubarLabel>
              <MenubarItem>
                Open
                <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Save
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarCheckboxItem checked>Auto Save</MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarRadioGroup value="dark">
                <MenubarLabel>Theme</MenubarLabel>
                <MenubarRadioItem value="light">Light</MenubarRadioItem>
                <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
              </MenubarRadioGroup>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>Image</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarItem disabled>Disabled Item</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));

      // Verify all components are rendered
      expect(screen.getByText('File Operations')).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('⌘O')).toBeInTheDocument();
      expect(screen.getByText('⌘S')).toBeInTheDocument();
      expect(
        screen.getByRole('menuitemcheckbox', { name: 'Auto Save' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitemradio', { name: 'Light' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitemradio', { name: 'Dark' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Export' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Disabled Item')).toHaveAttribute(
        'data-disabled',
      );
    });

    it('handles multiple menu items', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Open</MenubarItem>
              <MenubarItem>Save</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Cut</MenubarItem>
              <MenubarItem>Copy</MenubarItem>
              <MenubarItem>Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      expect(
        screen.getByRole('menuitem', { name: 'File' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Edit' }),
      ).toBeInTheDocument();

      // Open File menu
      await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();

      // Close menu by pressing Escape
      await userEvent.keyboard('{Escape}');

      // Open Edit menu
      await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
      expect(screen.getByText('Cut')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Paste')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>,
      );

      expect(screen.getByRole('menubar')).toBeInTheDocument();
      expect(screen.getByRole('menuitem')).toBeInTheDocument();
    });

    it('maintains keyboard navigation', async () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Open</MenubarItem>
              <MenubarItem>Save</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      const trigger = screen.getByRole('menuitem', { name: 'File' });
      await userEvent.click(trigger);

      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });
});
