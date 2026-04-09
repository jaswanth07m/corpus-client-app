import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Calendar } from '@/components/ui/calendar';

describe('Calendar', () => {
  it('renders correctly', () => {
    render(<Calendar defaultMonth={new Date(2023, 0)} />);

    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();

    // Navigation buttons should be present
    expect(
      screen.getByRole('button', { name: /previous/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('passes custom className to the root element', () => {
    const { container } = render(
      <Calendar
        className="my-custom-calendar"
        defaultMonth={new Date(2023, 0)}
      />,
    );

    // The day picker root usually has the class
    expect(container.firstChild).toHaveClass('my-custom-calendar');
    expect(container.firstChild).toHaveClass('p-3');
  });

  it('merges custom classNames properly', () => {
    const customClassNames = {
      day: 'custom-day-class',
      cell: 'custom-cell-class',
    };

    const { container } = render(
      <Calendar
        classNames={customClassNames}
        defaultMonth={new Date(2023, 0)}
      />,
    );

    const customCells = container.querySelectorAll('.custom-cell-class');
    expect(customCells.length).toBeGreaterThan(0);

    const customDays = container.querySelectorAll('.custom-day-class');
    expect(customDays.length).toBeGreaterThan(0);
  });

  it('renders showOutsideDays correctly by default', () => {
    // Feb 2023 starts on Wednesday, so Sun, Mon, Tue are outside days from Jan.
    const { container } = render(
      <Calendar showOutsideDays={true} defaultMonth={new Date(2023, 1)} />,
    );

    const outsideDays = container.querySelectorAll('.day-outside');
    expect(outsideDays.length).toBeGreaterThan(0);
  });

  it('disables showOutsideDays when set to false', () => {
    const { container } = render(
      <Calendar showOutsideDays={false} defaultMonth={new Date(2023, 1)} />,
    );

    const outsideDays = container.querySelectorAll('.day-outside');
    // react-day-picker hides or removes them entirely when showOutsideDays is false
    // Let's ensure the outside day class is either absent or invisible
    if (outsideDays.length > 0) {
      expect(outsideDays[0]).toHaveClass('invisible'); // The component adds 'invisible' class to hidden outside days
    } else {
      expect(outsideDays.length).toBe(0);
    }
  });

  it('allows changing months through navigation buttons', () => {
    render(<Calendar defaultMonth={new Date(2023, 5)} />);

    // DayPicker caption renders the month and year
    expect(screen.getByText(/June/i)).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    expect(screen.getByText(/May/i)).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(screen.getByText(/July/i)).toBeInTheDocument();
  });

  it('renders custom Icons for navigation', () => {
    render(<Calendar defaultMonth={new Date(2023, 0)} />);

    const prevBtn = screen.getByRole('button', { name: /previous/i });
    const nextBtn = screen.getByRole('button', { name: /next/i });

    // Verifies the custom IconLeft and IconRight render an SVG or valid DOM content
    expect(prevBtn.querySelector('svg')).toBeInTheDocument();
    expect(nextBtn.querySelector('svg')).toBeInTheDocument();

    // ChevronLeft/Right usually have those standard lucide classes
    expect(prevBtn.querySelector('svg')).toHaveClass('lucide-chevron-left');
    expect(nextBtn.querySelector('svg')).toHaveClass('lucide-chevron-right');
  });
});
