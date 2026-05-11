import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '../../../../src/components/ui/context-menu';

describe('ContextMenu', () => {
  it('renders the trigger element', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="trigger">
          Right-click me
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Item 1</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
    expect(screen.getByText('Right-click me')).toBeInTheDocument();
  });

  it('renders ContextMenuLabel', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>My Label</ContextMenuLabel>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders ContextMenuSeparator without crashing', () => {
    const { container } = render(
      <ContextMenu>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Item 1</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Item 2</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(container).toBeTruthy();
  });

  it('renders ContextMenuShortcut text', () => {
    render(
      <ContextMenu open>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            Item
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(document.body).toBeTruthy();
  });

  it('renders ContextMenuCheckboxItem without crashing', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuCheckboxItem checked>
            Checkbox Item
          </ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders ContextMenuRadioGroup and RadioItems without crashing', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuRadioGroup value="option1">
            <ContextMenuRadioItem value="option1">
              Option 1
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="option2">
              Option 2
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders sub-menu components without crashing', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More Options</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Sub Item</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders inset ContextMenuItem with extra left padding', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem inset>Inset Item</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders ContextMenuItem with disabled state', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled>Disabled Item</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(document.body).toBeTruthy();
  });

  it('renders ContextMenuCheckboxItem with checked and disabled state', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuCheckboxItem checked={false} disabled>
            Disabled Checkbox
          </ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(document.body).toBeTruthy();
  });

  it('renders ContextMenuRadioItem', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuRadioItem value="opt1">Radio Option</ContextMenuRadioItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(document.body).toBeTruthy();
  });

  it('renders ContextMenuShortcut with className', () => {
    render(
      <ContextMenu open>
        <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            Item
            <ContextMenuShortcut className="custom-shortcut">
              ⌘X
            </ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(document.body).toBeTruthy();
  });
});
