import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

describe('ui/accordion', () => {
  it('renders AccordionItem with default and custom classes', () => {
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="custom-item">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(
      container.querySelector('.border-b.custom-item'),
    ).toBeInTheDocument();
  });

  it('renders AccordionTrigger as a button with chevron icon and merges classes', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className="custom-trigger">
            Section 1
          </AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = screen.getByRole('button', { name: 'Section 1' });
    expect(trigger).toHaveClass('flex');
    expect(trigger).toHaveClass('flex-1');
    expect(trigger).toHaveClass('custom-trigger');

    const icon = trigger.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-4');
    expect(icon).toHaveClass('w-4');
  });

  it('wraps AccordionContent children in padded div and toggles open/closed state', () => {
    render(
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Details</AccordionTrigger>
          <AccordionContent className="custom-content">
            <span>Inner text</span>
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = screen.getByRole('button', { name: 'Details' });
    const innerText = screen.getByText('Inner text');
    const paddedWrapper = innerText.parentElement as HTMLElement;
    expect(paddedWrapper).toHaveClass('pb-4');
    expect(paddedWrapper).toHaveClass('pt-0');
    expect(paddedWrapper).toHaveClass('custom-content');

    const contentRoot = paddedWrapper.parentElement as HTMLElement;
    expect(contentRoot).toHaveAttribute('data-state', 'open');

    fireEvent.click(trigger);
    expect(contentRoot).toHaveAttribute('data-state', 'closed');

    fireEvent.click(trigger);
    expect(contentRoot).toHaveAttribute('data-state', 'open');
  });

  it('in single mode, opening one item closes the other', () => {
    const { container } = render(
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionContent>First content</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Second</AccordionTrigger>
          <AccordionContent>Second content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const firstTrigger = screen.getByRole('button', { name: 'First' });
    const secondTrigger = screen.getByRole('button', { name: 'Second' });

    const firstContentRoot = screen.getByText('First content').parentElement
      ?.parentElement as HTMLElement;
    expect(firstContentRoot).toHaveAttribute('data-state', 'open');

    fireEvent.click(secondTrigger);

    const secondContentRoot = screen.getByText('Second content').parentElement
      ?.parentElement as HTMLElement;
    expect(secondContentRoot).toHaveAttribute('data-state', 'open');
    expect(firstContentRoot).toHaveAttribute('data-state', 'closed');

    // sanity: both contents are within the rendered accordion
    expect(container).toContainElement(firstContentRoot);
    expect(container).toContainElement(secondContentRoot);
  });
});
