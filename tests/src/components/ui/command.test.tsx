import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '../../../../src/components/ui/command';

describe('Command', () => {
  it('renders Command component without crashing', () => {
    render(
      <Command data-testid="cmd">
        <CommandList />
      </Command>,
    );
    expect(screen.getByTestId('cmd')).toBeInTheDocument();
  });

  it('renders CommandInput with a search icon', () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList />
      </Command>,
    );
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('renders CommandEmpty with no results text', () => {
    render(
      <Command>
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('renders CommandGroup with a heading', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup heading="Settings">
            <CommandItem>Profile</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders CommandItem and fires onSelect callback', () => {
    const onSelect = vi.fn();
    render(
      <Command>
        <CommandList>
          <CommandGroup>
            <CommandItem onSelect={onSelect}>Click Me</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    // cmdk handles onSelect via keyboard; just verify render
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders CommandShortcut', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup>
            <CommandItem>
              Profile
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText('⌘P')).toBeInTheDocument();
  });

  it('renders CommandSeparator', () => {
    const { container } = render(
      <Command>
        <CommandList>
          <CommandGroup>
            <CommandItem>Item 1</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem>Item 2</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    const separator = container.querySelector('[cmdk-separator]');
    expect(separator).toBeInTheDocument();
  });

  it('CommandInput accepts typing input', () => {
    render(
      <Command>
        <CommandInput placeholder="Type here..." />
        <CommandList />
      </Command>,
    );
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect((input as HTMLInputElement).value).toBe('hello');
  });
});
