import React, { useState, useMemo, useRef } from 'react';
import { DailyPoint } from '@/lib/points';

interface PointsHeatmapProps {
  dailyData: DailyPoint[];
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const SQUARE_SIZE = 12; // Size of each day cell
const SQUARE_GAP = 2; // Gap between cells
const panelColors = [
  '#ebedf0', // 0: Empty (Level 0)
  '#bbf7d0', // 1: Lighter Green (Level 1)
  '#4ade80', // 2: Light Green (Level 2)
  '#16a34a', // 3: Green (Level 3)
  '#14532d', // 4: Darkest Green (Level 4)
];

interface TooltipData {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

interface CalendarDay {
  date: Date;
  points: number;
  level: number;
}

const PointsHeatmap: React.FC<PointsHeatmapProps> = ({ dailyData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    content: '',
    x: 0,
    y: 0,
  });

  // --- Data Preparation (Memoized for performance) ---
  const { calendarData, monthLabels } = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    startDate.setDate(endDate.getDate() + 1);

    const pointsMap = new Map(
      dailyData.map((item) => [item.date, item.points]),
    );
    const maxPoints = Math.max(1, ...dailyData.map((item) => item.points));

    const days = [];
    const currentDate = new Date(startDate);

    // Pad the beginning of the array to align the first day with Sunday
    const startDayOfWeek = currentDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Generate data for each day in the range
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const points = pointsMap.get(dateStr) || 0;

      let level = 0;
      if (points > 0) {
        const percentage = points / maxPoints;
        if (percentage >= 0.75) level = 4;
        else if (percentage >= 0.5) level = 3;
        else if (percentage >= 0.25) level = 2;
        else level = 1;
      }

      days.push({
        date: new Date(currentDate),
        points,
        level,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate month label positions
    const mLabels = [];
    let lastMonth = -1;
    days.forEach((day, index) => {
      if (day) {
        const month = day.date.getMonth();
        if (month !== lastMonth) {
          const weekIndex = Math.floor(index / 7);
          mLabels.push({
            label: MONTH_LABELS[month],
            col: weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return { calendarData: days, monthLabels: mLabels };
  }, [dailyData]);

  // --- Tooltip Event Handlers ---
  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    day: CalendarDay | null,
  ) => {
    if (!day || !containerRef.current) return;
    const cellRect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const pointsStr = `${day.points.toFixed(1)} points`;
    const dateStr = day.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    setTooltip({
      visible: true,
      content: `${pointsStr} on ${dateStr}`,
      x: cellRect.left - containerRect.left + cellRect.width / 2,
      y: cellRect.top - containerRect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const totalWeeks = Math.ceil(calendarData.length / 7);

  return (
    <div className="mt-6 relative" ref={containerRef}>
      {/* --- Custom Tooltip --- */}
      {tooltip.visible && (
        <div
          className="absolute z-10 px-2 py-1 text-xs font-semibold text-white bg-gray-900 rounded-md shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            top: tooltip.y,
            left: tooltip.x,
            transform: `translate(-50%, -100%) translateY(-${SQUARE_GAP * 2}px)`,
          }}
        >
          {tooltip.content}
        </div>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="inline-block">
          {/* --- Month Labels --- */}
          <div
            className="flex"
            style={{ marginLeft: '24px', paddingBottom: '4px' }}
          >
            {monthLabels.map(({ label, col }, index) => {
              const prevCol = index > 0 ? monthLabels[index - 1].col : 0;
              const colSpan = col - prevCol;
              if (colSpan <= 0) return null;
              return (
                <div
                  key={label}
                  className="text-xs text-gray-500"
                  style={{
                    minWidth: `${colSpan * (SQUARE_SIZE + SQUARE_GAP)}px`,
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          <div className="flex">
            {/* --- Day Labels (Sun, Mon, etc.) --- */}
            <div
              className="flex flex-col pr-2"
              style={{ gap: `${SQUARE_GAP}px` }}
            >
              {WEEK_DAYS.map((day, i) => (
                <div
                  key={day}
                  className="text-xs text-gray-500"
                  style={{
                    height: `${SQUARE_SIZE}px`,
                    visibility: i % 2 !== 0 ? 'visible' : 'hidden',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* --- Calendar Grid --- */}
            <div
              className="grid grid-flow-col grid-rows-7"
              style={{ gap: `${SQUARE_GAP}px` }}
            >
              {calendarData.map((day, index) => (
                <div
                  key={index}
                  className="rounded-sm cursor-pointer"
                  style={{
                    width: `${SQUARE_SIZE}px`,
                    height: `${SQUARE_SIZE}px`,
                    backgroundColor: day
                      ? panelColors[day.level]
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, day)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- Legend --- */}
      <div className="flex justify-end items-center gap-2 mt-2 text-xs text-gray-500">
        <span>Less</span>
        {panelColors.map((color, index) => (
          <div
            key={index}
            className="rounded-sm"
            style={{
              backgroundColor: color,
              width: `${SQUARE_SIZE}px`,
              height: `${SQUARE_SIZE}px`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export default PointsHeatmap;
