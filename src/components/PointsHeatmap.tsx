import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DailyPoint } from '@/lib/points';
import { TrendingUp } from 'lucide-react';

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
  const [keepTooltipVisible, setKeepTooltipVisible] = useState(false);

  // --- Data Preparation (Memoized for performance) ---
  const { calendarData, monthLabels } = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    startDate.setDate(endDate.getDate() + 1);

    const pointsMap = new Map(
      dailyData.map((item) => [item.date, item.points]),
    );

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

      // Fixed ranges like GitHub's contribution heatmap
      let level = 0;
      if (points > 0) {
        if (points >= 20)
          level = 4; // 20+ points: darkest green
        else if (points >= 10)
          level = 3; // 10-19 points: medium-dark green
        else if (points >= 5)
          level = 2; // 5-9 points: medium-light green
        else level = 1; // 1-4 points: lightest green
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
    let lastProcessedMonth = -1;

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (day) {
        const month = day.date.getMonth();

        // Only add a month label when we encounter the first day of a new month
        if (month !== lastProcessedMonth) {
          // Calculate which week this month starts in
          const weekIndex = Math.floor(i / 7);

          // Add the month label at the correct week position
          mLabels.push({
            label: MONTH_LABELS[month],
            col: weekIndex,
            date: day.date, // Store the date to identify oldest
          });

          lastProcessedMonth = month;
        }
      }
    }

    // If there are 2 or more month labels, mark the oldest (first) one to be hidden
    const processedMonthLabels = mLabels.map((label, index) => ({
      ...label,
      hide: mLabels.length >= 2 && index === 0,
    }));

    return { calendarData: days, monthLabels: processedMonthLabels };
  }, [dailyData]);

  // --- Tooltip Event Handlers ---
  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    day: CalendarDay | null,
  ) => {
    if (!day || !containerRef.current) return;
    // Only update tooltip if we're not keeping it visible from a click
    if (!keepTooltipVisible) {
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
    }
  };

  const handleMouseLeave = () => {
    // Only hide tooltip if we're not keeping it visible from a click
    if (!keepTooltipVisible) {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleClick = (
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

    // Toggle tooltip visibility on click
    if (
      keepTooltipVisible &&
      tooltip.content === `${pointsStr} on ${dateStr}`
    ) {
      // If clicking the same day again, hide the tooltip
      setTooltip((prev) => ({ ...prev, visible: false }));
      setKeepTooltipVisible(false);
    } else {
      // Show tooltip for the clicked day and keep it visible
      setTooltip({
        visible: true,
        content: `${pointsStr} on ${dateStr}`,
        x: cellRect.left - containerRect.left + cellRect.width / 2,
        y: cellRect.top - containerRect.top,
      });
      setKeepTooltipVisible(true);
    }
  };

  const totalWeeks = Math.ceil(calendarData.length / 7);

  // Close tooltip when clicking outside the heatmap
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (keepTooltipVisible) {
          setKeepTooltipVisible(false);
          setTooltip((prev) => ({ ...prev, visible: false }));
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [keepTooltipVisible]);

  return (
    <div className="relative" ref={containerRef}>
      {/* --- Heading and Legend --- */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          <p className="text-sm font-bold text-slate-900">Points Activity</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Less</span>
          {panelColors.map((color, index) => (
            <div
              key={index}
              className="rounded-sm"
              style={{
                backgroundColor: color,
                width: `${SQUARE_SIZE - 2}px`,
                height: `${SQUARE_SIZE - 2}px`,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* --- Custom Tooltip --- */}
      {(tooltip.visible || keepTooltipVisible) && (
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

      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          {/* --- Month Labels --- */}
          <div className="relative h-6" style={{ marginLeft: '24px' }}>
            {monthLabels
              .filter((monthLabel) => !monthLabel.hide) // Filter out hidden labels
              .map(({ label, col }) => (
                <div
                  key={label}
                  className="absolute text-xs text-gray-500 whitespace-nowrap"
                  style={{
                    left: `${col * (SQUARE_SIZE + SQUARE_GAP)}px`,
                  }}
                >
                  {label}
                </div>
              ))}
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
                  className="rounded-none cursor-pointer"
                  style={{
                    width: `${SQUARE_SIZE}px`,
                    height: `${SQUARE_SIZE}px`,
                    backgroundColor: day
                      ? panelColors[day.level]
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, day)}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => handleClick(e, day)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsHeatmap;
