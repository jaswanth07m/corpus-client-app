import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatModernTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} min ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hr ago`;
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days}d ago`;
  }

  return formatInTimeZone(date, 'Asia/Kolkata', 'MMM d, yyyy');
}

export function formatSizeMB(size: number): string {
  if (!size || isNaN(size)) return '';
  return `${(size / 1024 ** 2).toFixed(2)} MB`;
}

export function formatDuration(seconds: number): string {
  if (seconds == null || isNaN(seconds) || seconds === 0) return '';
  if (seconds < 0) return '-1:-2:-40';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

export function getISTDate(dateString: string): Date {
  const date = new Date(dateString);
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const totalMinutes = utcHours * 60 + utcMinutes + (5 * 60 + 30);
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  const daysToAdd = Math.floor(totalMinutes / 1440);

  const result = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + daysToAdd,
      newHours,
      newMinutes,
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
  return result;
}

export function enumToLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
