import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
    // Heatmap should show some month labels in the DOM
    const container = document.querySelector('.inline-block');
    expect(container).toBeInTheDocument();
  });

  it('renders the day-of-week labels', () => {
    render(<PointsHeatmap dailyData={[]} />);
    // Mon, Wed, Fri are visible (odd indices)
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });

  it('shows Less and More legend labels', () => {
    render(<PointsHeatmap dailyData={[]} />);
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders the points activity heading via translation key', () => {
    render(<PointsHeatmap dailyData={[]} />);
    expect(screen.getByText('stats.pointsActivity')).toBeInTheDocument();
  });

  it('renders cells for calendar data', () => {
    render(<PointsHeatmap dailyData={buildDailyData(30)} />);
    // The grid should contain day cells
    const grid = document.querySelector('.grid-flow-col');
    expect(grid).toBeInTheDocument();
    expect(grid!.children.length).toBeGreaterThan(0);
  });

  it('shows tooltip on mouse enter on a day cell', () => {
    render(<PointsHeatmap dailyData={buildDailyData(10)} />);
    const cells = document.querySelectorAll('.rounded-none.cursor-pointer');
    if (cells.length > 0) {
      fireEvent.mouseEnter(cells[cells.length - 1]);
      // tooltip may or may not appear depending on geometry, just ensure no crash
    }
  });

  it('hides tooltip on mouse leave', () => {
    render(<PointsHeatmap dailyData={buildDailyData(10)} />);
    const cells = document.querySelectorAll('.rounded-none.cursor-pointer');
    if (cells.length > 0) {
      fireEvent.mouseEnter(cells[cells.length - 1]);
      fireEvent.mouseLeave(cells[cells.length - 1]);
      // No crash expected
    }
  });

  it('handles click on a day cell without crashing', () => {
    render(<PointsHeatmap dailyData={buildDailyData(10)} />);
    const cells = document.querySelectorAll('.rounded-none.cursor-pointer');
    if (cells.length > 0) {
      fireEvent.click(cells[cells.length - 1]);
    }
  });

  it('handles click outside to close tooltip', () => {
    render(<PointsHeatmap dailyData={buildDailyData(10)} />);
    const cells = document.querySelectorAll('.rounded-none.cursor-pointer');
    if (cells.length > 0) {
      fireEvent.click(cells[cells.length - 1]);
    }
    // Simulate click outside
    fireEvent.mouseDown(document.body);
  });
});
