import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

// Mock recharts ResponsiveContainer since it uses ResizeObserver which might fail in jsdom
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: React.PropsWithChildren) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    Tooltip: ({ children }: React.PropsWithChildren) => (
      <div data-testid="recharts-tooltip">{children}</div>
    ),
    Legend: ({ children }: React.PropsWithChildren) => (
      <div data-testid="recharts-legend">{children}</div>
    ),
  };
});

describe('Chart Components', () => {
  describe('ChartContainer & ChartStyle', () => {
    it('throws error when useChart is used outside of ChartContainer', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      expect(() => render(<ChartTooltipContent />)).toThrow(
        'useChart must be used within a <ChartContainer />',
      );
      consoleSpy.mockRestore();
    });

    it('renders ChartContainer and underlying styles correctly', () => {
      const config = {
        sales: { color: 'red' },
        profit: { theme: { light: 'blue', dark: 'darkblue' } },
      };

      const { container } = render(
        <ChartContainer config={config} id="custom-test">
          <span data-testid="child">Chart</span>
        </ChartContainer>,
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toBeInTheDocument();

      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();

      const css = styleTag?.innerHTML || '';
      expect(css).toContain('--color-sales: red;');
      expect(css).toContain('--color-profit: blue;');
      expect(css).toContain('.dark [data-chart=chart-custom-test]');
      expect(css).toContain('--color-profit: darkblue;');
    });

    it('does not render style tag when no colors are provided', () => {
      const config = { empty: { label: 'No Color Here' } };
      const { container } = render(
        <ChartContainer config={config}>
          <div />
        </ChartContainer>,
      );
      expect(container.querySelector('style')).not.toBeInTheDocument();
    });

    it('renders ChartStyle gracefully when theme is partially defined, returning null inside map', () => {
      const config = {
        profit: {
          theme: { light: 'blue' } as Record<'light' | 'dark', string>,
        }, // intentionally missing dark theme
      };

      const { container } = render(
        <ChartContainer config={config} id="partial-theme-test">
          <span />
        </ChartContainer>,
      );

      const styleTag = container.querySelector('style');
      const css = styleTag?.innerHTML || '';
      // Confirms it parses only the defined ones properly
      expect(css).toContain('--color-profit: blue;');
    });
  });

  describe('ChartTooltipContent', () => {
    const config = {
      sales: {
        label: 'Sales Data',
        color: 'green',
        icon: () => <svg data-testid="icon" />,
      },
      revenue: { label: 'Revenue' },
      actualTarget: { label: 'Target Level' },
      value: { label: 'Fallback Value Label' },
    };

    const renderTooltip = (props: Record<string, unknown>) =>
      render(
        <ChartContainer config={config}>
          <ChartTooltipContent {...props} />
        </ChartContainer>,
      );

    it('returns null if not active or empty payload', () => {
      const { container, rerender } = render(
        <ChartContainer config={config}>
          <ChartTooltipContent
            active={false}
            payload={[{ dataKey: 'sales', value: 10 }]}
          />
        </ChartContainer>,
      );
      expect(container.querySelector('.grid')).not.toBeInTheDocument();

      rerender(
        <ChartContainer config={config}>
          <ChartTooltipContent active={true} payload={[]} />
        </ChartContainer>,
      );
      expect(container.querySelector('.grid')).not.toBeInTheDocument();
    });

    it('renders tooltip label and basic items', () => {
      const payload = [
        { dataKey: 'sales', value: 100, payload: {} },
        { dataKey: 'revenue', value: 200, payload: {} },
      ];
      renderTooltip({ active: true, payload, label: 'Oct 2023' });
      expect(screen.getByText('Oct 2023')).toBeInTheDocument();
      expect(screen.getByText('Sales Data')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('renders custom labelFormatter', () => {
      const payload = [{ dataKey: 'sales', value: 100, payload: {} }];
      renderTooltip({
        active: true,
        payload,
        label: 'Base',
        labelFormatter: (val: unknown) => `Formatted: ${val}`,
      });
      expect(screen.getByText('Formatted: Base')).toBeInTheDocument();
    });

    it('renders indicator variations', () => {
      const payload = [
        {
          dataKey: 'revenue',
          value: 50,
          color: 'blue',
          payload: { fill: 'blue' },
        },
      ];
      const { container, rerender } = render(
        <ChartContainer config={config}>
          <ChartTooltipContent active payload={payload} indicator="dot" />
        </ChartContainer>,
      );

      // dot class
      expect(container.querySelector('.h-2\\.5.w-2\\.5')).toBeInTheDocument();

      // line
      rerender(
        <ChartContainer config={config}>
          <ChartTooltipContent active payload={payload} indicator="line" />
        </ChartContainer>,
      );
      expect(container.querySelector('.w-1')).toBeInTheDocument();

      // dashed
      rerender(
        <ChartContainer config={config}>
          <ChartTooltipContent active payload={payload} indicator="dashed" />
        </ChartContainer>,
      );
      expect(container.querySelector('.border-dashed')).toBeInTheDocument();
    });

    it('renders icon instead of indicator if available from config', () => {
      const payload = [{ dataKey: 'sales', value: 40, payload: {} }];
      renderTooltip({ active: true, payload });
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('supports standard custom formatter execution', () => {
      const payload = [
        { dataKey: 'revenue', name: 'rev', value: 99, payload: {} },
      ];
      renderTooltip({
        active: true,
        payload,
        formatter: (val: number, name: string) => (
          <span data-testid="custom-fmt">
            {name}: {val}
          </span>
        ),
      });
      expect(screen.getByTestId('custom-fmt')).toHaveTextContent('rev: 99');
    });

    it('hides indicator when hideIndicator is true', () => {
      const payload = [{ dataKey: 'revenue', value: 10, payload: {} }];
      const { container } = renderTooltip({
        active: true,
        payload,
        hideIndicator: true,
      });

      // The un-rendered div has color-bg styling inline normally
      const indicatorDiv = container.querySelector(
        '.shrink-0.rounded-\\[2px\\]',
      );
      expect(indicatorDiv).not.toBeInTheDocument();
    });

    it('hides label when hideLabel is true', () => {
      const payload = [{ dataKey: 'revenue', value: 10, payload: {} }];
      renderTooltip({
        active: true,
        payload,
        label: 'Should Hide',
        hideLabel: true,
      });
      expect(screen.queryByText('Should Hide')).not.toBeInTheDocument();
    });

    it('supports retrieving tooltip label from config based on labelKey mapping', () => {
      // Extracts label from the item config mapped
      renderTooltip({
        active: true,
        payload: [{ dataKey: 'revenue', payload: {} }],
        labelKey: 'sales',
      });
      // Sales Data will appear twice: once as tooltip label, once as item label
      expect(screen.getAllByText('Sales Data').length).toBeGreaterThan(0);
    });

    it('extracts config label key from nested payload object safely', () => {
      const payloadWrapper = [
        {
          dataKey: 'dynamic',
          payload: { dynamic: 'actualTarget' }, // nested payload resolving to 'actualTarget'
          value: 60,
        },
      ];
      renderTooltip({ active: true, payload: payloadWrapper });
      expect(screen.getAllByText('Target Level').length).toBeGreaterThan(0);
    });

    it('extracts config label key directly from a direct payload property', () => {
      const payloadWrapper = [
        {
          dataKey: 'directProp',
          directProp: 'actualTarget', // This forces key in payload && typeof payload[key] === string
          value: 80,
          payload: {},
        },
      ];
      renderTooltip({ active: true, payload: payloadWrapper });
      expect(screen.getAllByText('Target Level').length).toBeGreaterThan(0);
    });

    it('gracefully handles non-object payloads or unknown configs cleanly', () => {
      // Avoid undefined/null which crash Recharts' assumptions, test valid but unknown shapes
      renderTooltip({
        active: true,
        payload: [
          { dataKey: 'unknown', name: 'unknown_name', value: 123, payload: {} },
        ],
      });
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('unknown_name')).toBeInTheDocument();
    });

    it('falls back to "value" key when payload item lacks name, dataKey, and labelKey properties covering optional assignments', () => {
      // Because our mock config has a `value: { label: 'Fallback Value Label' }` mapped,
      // the Tooltip dynamically evaluates `|| 'value'` assigning the fallback target to line 140 & 187!
      renderTooltip({
        active: true,
        payload: [{ value: 999, payload: {} }],
      });
      expect(
        screen.getAllByText('Fallback Value Label').length,
      ).toBeGreaterThan(0);
      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });

  describe('ChartLegendContent', () => {
    const config = {
      sales: {
        label: 'Sales Label',
        icon: () => <svg data-testid="legend-icon" />,
      },
      revenue: { label: 'Rev' },
    };

    const renderLegend = (props: Record<string, unknown>) =>
      render(
        <ChartContainer config={config}>
          <ChartLegendContent {...props} />
        </ChartContainer>,
      );

    it('returns null if payload is empty', () => {
      const { container } = renderLegend({ payload: [] });
      expect(
        container.querySelector('.items-center.justify-center.gap-4'),
      ).not.toBeInTheDocument();
    });

    it('renders legend items with label from config and displays color boxes appropriately', () => {
      const payload = [
        { dataKey: 'revenue', color: 'red', value: 'revenueVal' },
      ];
      const { container } = renderLegend({ payload });
      expect(screen.getByText('Rev')).toBeInTheDocument();
      // Should contain a colored square mapping to standard styles
      expect(container.querySelector('.h-2.w-2')).toBeInTheDocument();
    });

    it('renders icon if present in config properties', () => {
      const payload = [{ dataKey: 'sales', value: 'salesVal' }];
      renderLegend({ payload });
      expect(screen.getByTestId('legend-icon')).toBeInTheDocument();
    });

    it('hides icon when hideIcon is supplied as true', () => {
      const payload = [{ dataKey: 'sales', value: 'salesVal' }];
      renderLegend({ payload, hideIcon: true });
      expect(screen.queryByTestId('legend-icon')).not.toBeInTheDocument();
    });

    it('respects verticalAlign variants applying the correctly scaled padding', () => {
      const { container } = renderLegend({
        payload: [{ dataKey: 'revenue' }],
        verticalAlign: 'top',
      });
      expect(
        container.querySelector('.items-center.justify-center.gap-4'),
      ).toHaveClass('pb-3');

      const { container: containerBot } = renderLegend({
        payload: [{ dataKey: 'revenue' }],
        verticalAlign: 'bottom',
      });
      expect(
        containerBot.querySelector('.items-center.justify-center.gap-4'),
      ).toHaveClass('pt-3');
    });

    it('gracefully handles primitive or null items seamlessly passing edge type guards', () => {
      renderLegend({ payload: [123] });
      expect(screen.queryByTestId('legend-icon')).not.toBeInTheDocument();
    });
  });

  it('exports ChartTooltip and ChartLegend references properly directly linked back', () => {
    expect(ChartTooltip).toBeDefined();
    expect(ChartLegend).toBeDefined();
  });
});
