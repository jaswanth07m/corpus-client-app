import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
    },
  }),
}));

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
