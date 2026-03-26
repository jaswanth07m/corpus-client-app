import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatModernTime,
  formatSizeMB,
  formatDuration,
  getISTDate,
} from '../../../src/lib/utils';

describe('cn', () => {
  it('should return empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle a single class name', () => {
    expect(cn('btn')).toBe('btn');
  });

  it('should merge multiple class names', () => {
    expect(cn('btn', 'primary', 'large')).toBe('btn primary large');
  });

  it('should filter out falsy values (null, undefined, false)', () => {
    expect(cn('btn', null, undefined, false, 'primary')).toBe('btn primary');
  });

  it('should handle conditional classes with objects', () => {
    expect(cn('btn', { primary: true, disabled: false })).toBe('btn primary');
  });

  it('should handle arrays of class names', () => {
    expect(cn(['btn', 'primary'])).toBe('btn primary');
  });

  it('should merge tailwind classes properly (deduplicate)', () => {
    // twMerge should handle conflicting classes
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('should handle mixed input types', () => {
    expect(
      cn('btn', ['primary', 'large'], { disabled: false, active: true }, null),
    ).toBe('btn primary large active');
  });

  it('should handle empty strings', () => {
    expect(cn('', 'btn', '')).toBe('btn');
  });
});

describe('formatModernTime', () => {
  let now: Date;

  beforeEach(() => {
    now = new Date('2024-01-15T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty string for empty input', () => {
    expect(formatModernTime('')).toBe('');
  });

  it('should return empty string for null/undefined', () => {
    expect(formatModernTime(null as unknown as string)).toBe('');
    expect(formatModernTime(undefined as unknown as string)).toBe('');
  });

  it('should return "Just now" for diff < 60 seconds', () => {
    const date = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatModernTime(date)).toBe('Just now');
  });

  it('should return "Just now" for diff = 0 seconds', () => {
    expect(formatModernTime(now.toISOString())).toBe('Just now');
  });

  it('should return minutes ago for diff between 60 and 3600 seconds', () => {
    const date = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatModernTime(date)).toBe('5 min ago');
  });

  it('should return minutes ago for diff = 60 seconds (1 min)', () => {
    const date = new Date(now.getTime() - 60 * 1000).toISOString();
    expect(formatModernTime(date)).toBe('1 min ago');
  });

  it('should return minutes ago for diff = 3599 seconds', () => {
    const date = new Date(now.getTime() - 3599 * 1000).toISOString();
    expect(formatModernTime(date)).toBe('59 min ago');
  });

  it('should return hours ago for diff between 3600 and 86400 seconds', () => {
    const date = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatModernTime(date)).toBe('3 hr ago');
  });

  it('should return "1 hr ago" for diff = 3600 seconds', () => {
    const date = new Date(now.getTime() - 3600 * 1000).toISOString();
    expect(formatModernTime(date)).toBe('1 hr ago');
  });

  it('should return hours ago for diff = 86399 seconds', () => {
    const date = new Date(now.getTime() - 86399 * 1000).toISOString();
    expect(formatModernTime(date)).toBe('23 hr ago');
  });

  it('should return days ago for diff between 86400 and 604800 seconds', () => {
    const date = new Date(
      now.getTime() - 5 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatModernTime(date)).toBe('5d ago');
  });

  it('should return "1d ago" for diff = 86400 seconds', () => {
    const date = new Date(now.getTime() - 86400 * 1000).toISOString();
    expect(formatModernTime(date)).toBe('1d ago');
  });

  it('should return "6d ago" for diff = 604799 seconds', () => {
    const date = new Date(now.getTime() - 604799 * 1000).toISOString();
    expect(formatModernTime(date)).toBe('6d ago');
  });

  it('should return formatted date for diff >= 604800 seconds (1 week+)', () => {
    const date = new Date(
      now.getTime() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatModernTime(date)).toBe('Jan 5, 2024');
  });

  it('should return formatted date with year for dates in previous year', () => {
    const date = new Date('2023-06-15T12:00:00Z').toISOString();
    expect(formatModernTime(date)).toBe('Jun 15, 2023');
  });

  it('should handle invalid date strings gracefully', () => {
    // Invalid dates result in "Invalid Date" being returned
    expect(formatModernTime('invalid-date')).toBe('Invalid Date');
  });
});

describe('formatSizeMB', () => {
  it('should return empty string for 0', () => {
    expect(formatSizeMB(0)).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(formatSizeMB(NaN)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatSizeMB(undefined as unknown as number)).toBe('');
  });

  it('should return empty string for null', () => {
    expect(formatSizeMB(null as unknown as number)).toBe('');
  });

  it('should format size in bytes to MB (1 MB)', () => {
    expect(formatSizeMB(1024 * 1024)).toBe('1.00 MB');
  });

  it('should format size in bytes to MB (0.5 MB)', () => {
    expect(formatSizeMB(512 * 1024)).toBe('0.50 MB');
  });

  it('should format size in bytes to MB (10 MB)', () => {
    expect(formatSizeMB(10 * 1024 * 1024)).toBe('10.00 MB');
  });

  it('should format size with decimal precision', () => {
    expect(formatSizeMB(1234567)).toBe('1.18 MB');
  });

  it('should handle very small sizes', () => {
    expect(formatSizeMB(1024)).toBe('0.00 MB');
  });

  it('should handle large file sizes (1 GB)', () => {
    expect(formatSizeMB(1024 * 1024 * 1024)).toBe('1024.00 MB');
  });

  it('should handle negative numbers', () => {
    expect(formatSizeMB(-1024 * 1024)).toBe('-1.00 MB');
  });
});

describe('formatDuration', () => {
  it('should return empty string for 0', () => {
    expect(formatDuration(0)).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(formatDuration(NaN)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatDuration(undefined as unknown as number)).toBe('');
  });

  it('should return empty string for null', () => {
    expect(formatDuration(null as unknown as number)).toBe('');
  });

  it('should format seconds only (no hours or minutes)', () => {
    expect(formatDuration(45)).toBe('00:00:45');
  });

  it('should format exactly 1 minute', () => {
    expect(formatDuration(60)).toBe('00:01:00');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(125)).toBe('00:02:05');
  });

  it('should format exactly 1 hour', () => {
    expect(formatDuration(3600)).toBe('01:00:00');
  });

  it('should format hours, minutes, and seconds', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });

  it('should format hours and minutes (no seconds)', () => {
    expect(formatDuration(7200)).toBe('02:00:00');
  });

  it('should format long durations', () => {
    expect(formatDuration(90061)).toBe('25:01:01');
  });

  it('should pad single digit values with leading zeros', () => {
    expect(formatDuration(5)).toBe('00:00:05');
    expect(formatDuration(65)).toBe('00:01:05');
    expect(formatDuration(3605)).toBe('01:00:05');
  });

  it('should handle negative numbers', () => {
    // Negative numbers result in negative floor division, producing unexpected format
    expect(formatDuration(-100)).toBe('-1:-2:-40');
  });
});

describe('getISTDate', () => {
  it('should convert UTC midnight to IST (adds 5:30 hours)', () => {
    const utcDate = '2024-01-15T00:00:00Z';
    const istDate = getISTDate(utcDate);
    // The function adds 5.5 hours to UTC time
    // Date object stores the adjusted time as UTC
    expect(istDate.getUTCHours()).toBe(5);
    expect(istDate.getUTCMinutes()).toBe(30);
  });

  it('should convert UTC noon to IST (adds 5:30 hours)', () => {
    const utcDate = '2024-01-15T12:00:00Z';
    const istDate = getISTDate(utcDate);
    expect(istDate.getUTCHours()).toBe(17);
    expect(istDate.getUTCMinutes()).toBe(30);
  });

  it('should handle date crossing midnight in IST', () => {
    // 2024-01-14 20:00 UTC + 5:30 = 2024-01-15 01:30 IST (stored as UTC in Date)
    const utcDate = '2024-01-14T20:00:00Z';
    const istDate = getISTDate(utcDate);
    expect(istDate.getUTCDate()).toBe(15);
    expect(istDate.getUTCHours()).toBe(1);
    expect(istDate.getUTCMinutes()).toBe(30);
  });

  it('should handle year boundary crossing', () => {
    // 2023-12-31 20:00 UTC + 5:30 = 2024-01-01 01:30 (stored as UTC in Date)
    const utcDate = '2023-12-31T20:00:00Z';
    const istDate = getISTDate(utcDate);
    expect(istDate.getUTCFullYear()).toBe(2024);
    expect(istDate.getUTCMonth()).toBe(0); // January
    expect(istDate.getUTCDate()).toBe(1);
  });

  it('should handle end of day UTC (23:59)', () => {
    const utcDate = '2024-01-15T23:59:00Z';
    const istDate = getISTDate(utcDate);
    // 23:59 + 5:30 = 29:29 = next day 05:29
    expect(istDate.getUTCHours()).toBe(5);
    expect(istDate.getUTCMinutes()).toBe(29);
    expect(istDate.getUTCDate()).toBe(16);
  });

  it('should preserve the time component correctly', () => {
    const utcDate = '2024-01-15T10:45:30Z';
    const istDate = getISTDate(utcDate);
    // 10:45:30 + 5:30 = 16:15:30 (stored as UTC in Date)
    expect(istDate.getUTCHours()).toBe(16);
    expect(istDate.getUTCMinutes()).toBe(15);
    expect(istDate.getUTCSeconds()).toBe(30);
  });

  it('should handle invalid date string', () => {
    const istDate = getISTDate('invalid-date');
    expect(istDate.toString()).toBe('Invalid Date');
  });

  it('should handle empty string', () => {
    const istDate = getISTDate('');
    expect(istDate.toString()).toBe('Invalid Date');
  });

  it('should handle Date object input (if passed)', () => {
    const date = new Date('2024-01-15T00:00:00Z');
    const istDate = getISTDate(date.toISOString());
    expect(istDate.getUTCHours()).toBe(5);
    expect(istDate.getUTCMinutes()).toBe(30);
  });

  it('should handle timezone-aware UTC strings', () => {
    const utcDate = '2024-01-15T00:00:00+00:00';
    const istDate = getISTDate(utcDate);
    expect(istDate.getUTCHours()).toBe(5);
    expect(istDate.getUTCMinutes()).toBe(30);
  });
});
