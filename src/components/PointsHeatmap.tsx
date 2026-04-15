import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip, type TooltipRefProps } from 'react-tooltip';
import 'react-calendar-heatmap/dist/styles.css';
import 'react-tooltip/dist/react-tooltip.css';
import { TrendingUp } from 'lucide-react';

import { DailyPoint } from '@/lib/points';

import './PointsHeatmap.css';

interface PointsHeatmapProps {
  dailyData: DailyPoint[];
}

interface HeatmapValue {
  date: string;
  count: number;
}

const getLevel = (count: number) => {
  if (count >= 20) return 4;
  if (count >= 10) return 3;
  if (count >= 5) return 2;
  if (count >= 1) return 1;
  return 0;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateKey = (date: string) => date.slice(0, 10);

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  ml: 'ml-IN',
};

const PointsHeatmap: React.FC<PointsHeatmapProps> = ({ dailyData }) => {
  const { t, i18n } = useTranslation();
  const tooltipRef = useRef<TooltipRefProps | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);

  const language = i18n?.language ?? 'en';
  const locale = LOCALE_MAP[language] ?? 'en-US';

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    const baseDate = new Date(2024, 0, 1);
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(baseDate);
      date.setMonth(i);
      return formatter.format(date);
    });
  }, [locale]);

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const baseDate = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      return formatter.format(date);
    });
  }, [locale]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [locale],
  );

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const { startDate, endDate, values } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const countsByDate = dailyData.reduce((acc, item) => {
      const dateKey = normalizeDateKey(item.date);
      if (!dateKey) return acc;
      const nextCount = (acc.get(dateKey) ?? 0) + (Number(item.points) || 0);
      acc.set(dateKey, nextCount);
      return acc;
    }, new Map<string, number>());

    const heatmapValues: HeatmapValue[] = [];
    const currentDate = new Date(oneYearAgo);

    while (currentDate <= today) {
      const dateKey = toDateKey(currentDate);
      heatmapValues.push({
        date: dateKey,
        count: countsByDate.get(dateKey) ?? 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      startDate: oneYearAgo,
      endDate: today,
      values: heatmapValues,
    };
  }, [dailyData]);

  const buildTooltipContent = (value: HeatmapValue) => {
    const pointsLabel = numberFormatter.format(value.count);
    const dateLabel = dateFormatter.format(new Date(`${value.date}T00:00:00`));
    const translated = t('heatmap.activityOnDate');
    if (translated === 'heatmap.activityOnDate') {
      return `${pointsLabel} points on ${dateLabel}`;
    }
    return translated
      .replace('{{count}}', pointsLabel)
      .replace('{{date}}', dateLabel);
  };

  const openTooltip = (
    event: React.MouseEvent<SVGRectElement>,
    value: HeatmapValue,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    tooltipRef.current?.open({
      content: buildTooltipContent(value),
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
      place: 'top',
      delay: 0,
    });
  };

  const handleMouseOver = (
    event: React.MouseEvent<SVGRectElement>,
    value: { date: string | number | Date; count?: number } | null,
  ) => {
    if (!value || typeof value.date !== 'string') return;
    if (pinnedDate && pinnedDate !== value.date) return;
    const heatmapValue: HeatmapValue = {
      date: value.date,
      count: value.count ?? 0,
    };
    openTooltip(event, heatmapValue);
  };

  const handleMouseLeave = () => {
    if (pinnedDate) return;
    tooltipRef.current?.close({ delay: 0 });
  };

  const handleClick = (
    event: React.MouseEvent<SVGRectElement>,
    value: { date: string | number | Date; count?: number } | null,
  ) => {
    if (!value || typeof value.date !== 'string') return;

    if (pinnedDate === value.date) {
      setPinnedDate(null);
      tooltipRef.current?.close({ delay: 0 });
      return;
    }

    const heatmapValue: HeatmapValue = {
      date: value.date,
      count: value.count ?? 0,
    };
    setPinnedDate(value.date);
    openTooltip(event, heatmapValue);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        pinnedDate &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setPinnedDate(null);
        tooltipRef.current?.close({ delay: 0 });
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [pinnedDate]);

  return (
    <div className="corpus-points-heatmap relative w-full" ref={containerRef}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          <p className="text-sm font-bold text-slate-900">
            {t('stats.pointsActivity')}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>{t('tour.heatmap.less')}</span>
          <div className="flex items-center gap-[2px]">
            <span className="heatmap-legend-swatch heatmap-level-0" />
            <span className="heatmap-legend-swatch heatmap-level-1" />
            <span className="heatmap-legend-swatch heatmap-level-2" />
            <span className="heatmap-legend-swatch heatmap-level-3" />
            <span className="heatmap-legend-swatch heatmap-level-4" />
          </div>
          <span>{t('tour.heatmap.more')}</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="corpus-points-heatmap__chart min-w-full">
          <CalendarHeatmap
            values={
              values as { date: string | number | Date; count?: number }[]
            }
            startDate={startDate}
            endDate={endDate}
            showWeekdayLabels
            monthLabels={monthLabels}
            weekdayLabels={weekdayLabels}
            gutterSize={2}
            classForValue={(value) => {
              if (!value) return 'heatmap-level-0';
              return `heatmap-level-${getLevel(Number(value.count) || 0)}`;
            }}
            onMouseOver={handleMouseOver}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          />
        </div>
      </div>

      <Tooltip
        ref={tooltipRef}
        imperativeModeOnly
        positionStrategy="fixed"
        className="corpus-heatmap-tooltip"
        noArrow={false}
        opacity={1}
        style={{
          backgroundColor: 'hsl(222.2 84% 4.9%)',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 600,
          borderRadius: '0.5rem',
          padding: '0.375rem 0.625rem',
          boxShadow:
            '0 10px 20px -5px rgba(15, 23, 42, 0.3), 0 4px 6px -4px rgba(15, 23, 42, 0.3)',
          zIndex: 50,
        }}
      />
    </div>
  );
};

export default PointsHeatmap;
