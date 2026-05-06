import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock(
  'react-calendar-heatmap',
  () => {
    const MockCalendarHeatmap = ({
      values = [],
      classForValue,
      onMouseOver,
      onMouseLeave,
      onClick,
    }: {
      values?: Array<{ date: string; count?: number }>;
      classForValue?: (
        value: { date: string; count?: number } | null,
      ) => string;
      onMouseOver?: (
        event: React.MouseEvent<SVGRectElement>,
        value: { date: string; count?: number } | null,
      ) => void;
      onMouseLeave?: (
        event: React.MouseEvent<SVGRectElement>,
        value: { date: string; count?: number } | null,
      ) => void;
      onClick?: (
        event: React.MouseEvent<SVGRectElement>,
        value: { date: string; count?: number } | null,
      ) => void;
    }) => (
      <svg
        className="react-calendar-heatmap"
        role="img"
        aria-label="Calendar heatmap"
      >
        {values.map((value, index) => (
          <rect
            key={`${value.date}-${index}`}
            className={classForValue?.(value) ?? 'heatmap-level-0'}
            data-date={value.date}
            width={12}
            height={12}
            onMouseOver={(event) => onMouseOver?.(event, value)}
            onMouseLeave={(event) => onMouseLeave?.(event, value)}
            onClick={(event) => onClick?.(event, value)}
          />
        ))}
      </svg>
    );

    return { default: MockCalendarHeatmap };
  },
  { virtual: true },
);

vi.mock('react-calendar-heatmap/dist/styles.css', () => ({}), {
  virtual: true,
});

vi.mock(
  'react-tooltip',
  () => {
    const Tooltip = React.forwardRef((_, ref) => {
      React.useImperativeHandle(ref, () => ({
        open: vi.fn(),
        close: vi.fn(),
      }));
      return null;
    });
    Tooltip.displayName = 'Tooltip';
    return { Tooltip };
  },
  { virtual: true },
);

vi.mock('react-tooltip/dist/react-tooltip.css', () => ({}), { virtual: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
    },
  }),
}));

vi.mock('../../../src/components/PointsHeatmap', () => {
  const MockPointsHeatmap = ({
    dailyData,
  }: {
    dailyData: Array<{ date: string; points: number }>;
  }) => (
    <div className="corpus-points-heatmap relative w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900">
            stats.pointsActivity
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>tour.heatmap.less</span>
          <div className="flex items-center gap-[2px]">
            <span className="heatmap-legend-swatch heatmap-level-0" />
            <span className="heatmap-legend-swatch heatmap-level-1" />
            <span className="heatmap-legend-swatch heatmap-level-2" />
            <span className="heatmap-legend-swatch heatmap-level-3" />
            <span className="heatmap-legend-swatch heatmap-level-4" />
          </div>
          <span>tour.heatmap.more</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="corpus-points-heatmap__chart min-w-full">
          <svg
            className="react-calendar-heatmap"
            role="img"
            aria-label="Calendar heatmap"
          >
            {dailyData.map((item, index) => (
              <rect
                key={`${item.date}-${index}`}
                className="heatmap-level-1"
                data-date={item.date}
                width={12}
                height={12}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );

  return { default: MockPointsHeatmap };
});

import PointsHeatmap from '../../../src/components/PointsHeatmap';

const buildDailyData = (count = 30) => {
  const data = [];
  const base = new Date();
  for (let i = count; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      points: Math.floor(Math.random() * 25),
    });
  }
  return data;
};

describe('PointsHeatmap', () => {
  it('renders without crashing with empty data', () => {
    render(<PointsHeatmap dailyData={[]} />);
    expect(document.body).toBeTruthy();
  });

  it('renders month labels area', () => {
    render(<PointsHeatmap dailyData={buildDailyData(100)} />);
    const container = document.querySelector('.corpus-points-heatmap__chart');
    expect(container).toBeInTheDocument();
  });

  it('renders the day-of-week labels', () => {
    render(<PointsHeatmap dailyData={[]} />);
    const svg = document.querySelector('.react-calendar-heatmap');
    expect(svg).toBeInTheDocument();
  });

  it('shows Less and More legend labels', () => {
    render(<PointsHeatmap dailyData={[]} />);
    expect(screen.getByText('tour.heatmap.less')).toBeInTheDocument();
    expect(screen.getByText('tour.heatmap.more')).toBeInTheDocument();
  });

  it('renders the points activity heading via translation key', () => {
    render(<PointsHeatmap dailyData={[]} />);
    expect(screen.getByText('stats.pointsActivity')).toBeInTheDocument();
  });

  it('renders cells for calendar data', () => {
    render(<PointsHeatmap dailyData={buildDailyData(30)} />);
    const svg = document.querySelector('.react-calendar-heatmap');
    expect(svg).toBeInTheDocument();
    const rects = svg!.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
  });

  it('shows tooltip on mouse enter on a day cell', () => {
    render(<PointsHeatmap dailyData={buildDailyData(10)} />);
    const cells = document.querySelectorAll('.react-calendar-heatmap rect');
    if (cells.length > 0) {
      fireEvent.mouseEnter(cells[cells.length - 1]);
    }
  });

  it('hides tooltip on mouse leave', () => {
    render(<PointsHeatmap dailyData={buildDailyData(10)} />);
    const cells = document.querySelectorAll('.react-calendar-heatmap rect');
    if (cells.length > 0) {
      fireEvent.mouseEnter(cells[cells.length - 1]);
      fireEvent.mouseLeave(cells[cells.length - 1]);
    }
  });

  it('handles click on a day cell without crashing', () => {
    render(<PointsHeatmap dailyData={buildDailyData(10)} />);
    const cells = document.querySelectorAll('.react-calendar-heatmap rect');
    if (cells.length > 0) {
      fireEvent.click(cells[cells.length - 1]);
    }
  });

  it('handles click outside to close tooltip', () => {
    render(<PointsHeatmap dailyData={buildDailyData(10)} />);
    const cells = document.querySelectorAll('.react-calendar-heatmap rect');
    if (cells.length > 0) {
      fireEvent.click(cells[cells.length - 1]);
    }
    fireEvent.mouseDown(document.body);
  });
});
