import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../../src/components/ui/toggle-group';

describe('ToggleGroup', () => {
  it('renders without crashing', () => {
    render(
      <ToggleGroup type="single" data-testid="toggle-group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId('toggle-group')).toBeInTheDocument();
  });

  it('renders all items', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Italic')).toBeInTheDocument();
    expect(screen.getByText('Underline')).toBeInTheDocument();
  });

  it('renders multiple selection type', () => {
    render(
      <ToggleGroup type="multiple" data-testid="multi-group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId('multi-group')).toBeInTheDocument();
  });

  it('toggles item on click in single mode', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="bold" data-testid="bold-item">
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    const boldItem = screen.getByTestId('bold-item');
    fireEvent.click(boldItem);
    expect(boldItem).toHaveAttribute('data-state', 'on');
  });

  it('applies variant to items from context', () => {
    render(
      <ToggleGroup type="single" variant="outline" data-testid="outline-group">
        <ToggleGroupItem value="a" data-testid="item-a">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    const item = screen.getByTestId('item-a');
    expect(item.className).toContain('border');
  });

  it('applies custom className to ToggleGroup', () => {
    render(
      <ToggleGroup type="single" className="custom-group" data-testid="group">
        <ToggleGroupItem value="x">X</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId('group').className).toContain('custom-group');
  });

  it('can render with sm size', () => {
    render(
      <ToggleGroup type="single" size="sm">
        <ToggleGroupItem value="a" data-testid="sm-item">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    const item = screen.getByTestId('sm-item');
    expect(item.className).toContain('h-9');
  });

  it('disables items when disabled prop is set', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" disabled data-testid="disabled-item">
          Disabled
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId('disabled-item')).toBeDisabled();
  });
});
