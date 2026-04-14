import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs', () => {
  describe('Tabs (Root)', () => {
    it('renders Tabs root with children', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('respects defaultValue prop', () => {
      render(
        <Tabs defaultValue="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });

    it('handles controlled value prop', () => {
      render(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });

    it('calls onValueChange when tab is selected', async () => {
      const handleValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2);
      expect(handleValueChange).toHaveBeenCalledWith('tab2');
    });

    it('applies orientation prop', () => {
      render(
        <Tabs defaultValue="tab1" orientation="vertical">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveAttribute('data-orientation', 'vertical');
    });
  });

  describe('TabsList', () => {
    it('renders TabsList with default className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass(
        'inline-flex',
        'h-10',
        'items-center',
        'justify-center',
        'rounded-md',
        'bg-muted',
        'p-1',
      );
    });

    it('applies custom className to TabsList', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-class">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('custom-class');
    });

    it('forwards ref to TabsList', () => {
      const ref = vi.fn();
      render(
        <Tabs defaultValue="tab1">
          <TabsList ref={ref}>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
    });
  });

  describe('TabsTrigger', () => {
    it('renders TabsTrigger correctly', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByRole('tab', { name: 'Tab 1' });
      expect(trigger).toBeInTheDocument();
    });

    it('applies default className to TabsTrigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByRole('tab', { name: 'Tab 1' });
      expect(trigger).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'whitespace-nowrap',
        'rounded-sm',
        'px-3',
        'py-1.5',
        'text-sm',
        'font-medium',
      );
    });

    it('applies custom className to TabsTrigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByRole('tab', { name: 'Tab 1' });
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('applies active state styles when selected', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const activeTrigger = screen.getByRole('tab', { name: 'Tab 1' });
      expect(activeTrigger).toHaveAttribute('data-state', 'active');
    });

    it('applies disabled styles when disabled', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" disabled>
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByRole('tab', { name: 'Tab 1' });
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveClass(
        'disabled:pointer-events-none',
        'disabled:opacity-50',
      );
    });

    it('applies focus-visible ring styles', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByRole('tab', { name: 'Tab 1' });
      fireEvent.focus(trigger);
      expect(trigger).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
      );
    });

    it('forwards ref to TabsTrigger', () => {
      const ref = vi.fn();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" ref={ref}>
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it('passes through HTML attributes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger
              value="tab1"
              data-testid="trigger-test"
              aria-label="First Tab"
            >
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      const trigger = screen.getByTestId('trigger-test');
      expect(trigger).toHaveAttribute('aria-label', 'First Tab');
    });
  });

  describe('TabsContent', () => {
    it('renders TabsContent when tab is active', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('does not render inactive TabsContent', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });

    it('renders content when tab becomes active', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('applies default className to TabsContent', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );

      const content = screen.getByText('Content 1');
      expect(content).toHaveClass('mt-2', 'ring-offset-background');
    });

    it('applies custom className to TabsContent', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content">
            Content 1
          </TabsContent>
        </Tabs>,
      );

      const content = screen.getByText('Content 1');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref to TabsContent', () => {
      const ref = vi.fn();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" ref={ref}>
            Content 1
          </TabsContent>
        </Tabs>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it('passes through HTML attributes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="content-test" role="tabpanel">
            Content 1
          </TabsContent>
        </Tabs>,
      );

      const content = screen.getByTestId('content-test');
      expect(content).toHaveAttribute('role', 'tabpanel');
    });
  });

  describe('Tabs Integration', () => {
    it('switches between tabs correctly', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: 'Tab 3' }));

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });

    it('maintains active state on re-render', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();

      rerender(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1 Updated</TabsContent>
          <TabsContent value="tab2">Content 2 Updated</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText('Content 2 Updated')).toBeInTheDocument();
    });
  });
});
