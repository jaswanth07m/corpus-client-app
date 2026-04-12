import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  formatDistanceToNow,
  intervalToDuration,
  formatDuration as dfFormatDuration,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatModernTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatSizeMB(size: number): string {
  if (!size || isNaN(size)) return '';
  return `${(size / 1024 ** 2).toFixed(2)} MB`;
}

export function formatDuration(seconds: number): string {
  if (seconds == null || isNaN(seconds)) return '';

  const duration = intervalToDuration({
    start: new Date(0),
    end: new Date(seconds * 1000),
  });

  return dfFormatDuration(duration, {
    format: ['hours', 'minutes', 'seconds'],
    zero: true,
  });
}

export function getISTDate(dateString: string): Date {
  const date = new Date(dateString);
  return toZonedTime(date, 'Asia/Kolkata');
}
