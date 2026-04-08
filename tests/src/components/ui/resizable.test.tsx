import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

// Mock lucide-react GripVertical
vi.mock('lucide-react', () => ({
  GripVertical: ({ className }: { className?: string }) => (
    <div data-testid="grip-vertical" className={className}>
      Grip
    </div>
  ),
}));

describe('Resizable Components', () => {
  describe('ResizablePanelGroup', () => {
    it('renders horizontal ResizablePanelGroup correctly', () => {
      render(
        <ResizablePanelGroup direction="horizontal" data-testid="panel-group-h">
          <ResizablePanel defaultSize={20}>Panel 1</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80}>Panel 2</ResizablePanel>
        </ResizablePanelGroup>,
      );

      const group = screen.getByTestId('panel-group-h');
      expect(group).toBeInTheDocument();
      expect(group).toHaveClass('flex h-full w-full');
      expect(group).toHaveAttribute('data-panel-group-direction', 'horizontal');
    });

    it('renders vertical ResizablePanelGroup correctly', () => {
      render(
        <ResizablePanelGroup direction="vertical" data-testid="panel-group-v">
          <ResizablePanel defaultSize={20}>Panel 1</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80}>Panel 2</ResizablePanel>
        </ResizablePanelGroup>,
      );

      const group = screen.getByTestId('panel-group-v');
      expect(group).toBeInTheDocument();
      expect(group).toHaveClass(
        'data-[panel-group-direction=vertical]:flex-col',
      );
      expect(group).toHaveAttribute('data-panel-group-direction', 'vertical');
    });

    it('applies custom className to ResizablePanelGroup', () => {
      render(
        <ResizablePanelGroup
          direction="horizontal"
          className="custom-group-class"
          data-testid="panel-group-custom"
        >
          <ResizablePanel>Content</ResizablePanel>
        </ResizablePanelGroup>,
      );
      expect(screen.getByTestId('panel-group-custom')).toHaveClass(
        'custom-group-class',
      );
    });
  });

  describe('ResizablePanel', () => {
    it('renders ResizablePanel correctly', () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel data-testid="panel">Panel Content</ResizablePanel>
        </ResizablePanelGroup>,
      );
      const panel = screen.getByTestId('panel');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveTextContent('Panel Content');
    });
  });

  describe('ResizableHandle', () => {
    it('renders ResizableHandle correctly', () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>P1</ResizablePanel>
          <ResizableHandle data-testid="handle" />
          <ResizablePanel defaultSize={50}>P2</ResizablePanel>
        </ResizablePanelGroup>,
      );
      const handle = screen.getByTestId('handle');
      expect(handle).toBeInTheDocument();
      expect(handle).toHaveAttribute('data-panel-resize-handle-id');
      expect(handle).toHaveClass(
        'relative flex w-px items-center justify-center',
      );
    });

    it('renders ResizableHandle with icon when withHandle prop is true', () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>P1</ResizablePanel>
          <ResizableHandle withHandle={true} data-testid="handle" />
          <ResizablePanel defaultSize={50}>P2</ResizablePanel>
        </ResizablePanelGroup>,
      );
      expect(screen.getByTestId('grip-vertical')).toBeInTheDocument();
    });

    it('applies vertical styles to ResizableHandle', () => {
      render(
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={50}>P1</ResizablePanel>
          <ResizableHandle data-testid="handle" />
          <ResizablePanel defaultSize={50}>P2</ResizablePanel>
        </ResizablePanelGroup>,
      );
      const handle = screen.getByTestId('handle');
      expect(handle).toHaveAttribute('data-panel-group-direction', 'vertical');
      // The handle classes expect this data attribute to be present on itself or its container if context works
      expect(handle).toHaveClass(
        'data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full',
      );
    });

    it('applies custom className to ResizableHandle', () => {
      render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>P1</ResizablePanel>
          <ResizableHandle
            className="custom-handle-class"
            data-testid="handle"
          />
          <ResizablePanel defaultSize={50}>P2</ResizablePanel>
        </ResizablePanelGroup>,
      );
      expect(screen.getByTestId('handle')).toHaveClass('custom-handle-class');
    });
  });
});
