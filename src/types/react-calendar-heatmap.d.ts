declare module 'react-calendar-heatmap' {
  import * as React from 'react';

  export interface CalendarHeatmapValue {
    date: string | number | Date;
    count?: number;
    [key: string]: unknown;
  }

  export interface CalendarHeatmapProps {
    values: CalendarHeatmapValue[];
    startDate?: string | number | Date;
    endDate?: string | number | Date;
    showWeekdayLabels?: boolean;
    showMonthLabels?: boolean;
    showOutOfRangeDays?: boolean;
    horizontal?: boolean;
    gutterSize?: number;
    monthLabels?: string[];
    weekdayLabels?: string[];
    classForValue?: (value: CalendarHeatmapValue | null) => string;
    onClick?: (
      event: React.MouseEvent<SVGRectElement>,
      value: CalendarHeatmapValue | null,
    ) => void;
    onMouseOver?: (
      event: React.MouseEvent<SVGRectElement>,
      value: CalendarHeatmapValue | null,
    ) => void;
    onMouseLeave?: (
      event: React.MouseEvent<SVGRectElement>,
      value: CalendarHeatmapValue | null,
    ) => void;
  }

  const CalendarHeatmap: React.ComponentType<CalendarHeatmapProps>;

  export default CalendarHeatmap;
}
