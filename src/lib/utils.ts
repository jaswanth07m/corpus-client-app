import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date string as a modern relative time (e.g. '2 hr ago', 'Just now', etc.)
export function formatModernTime(dateString: string): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format a size in bytes as MB string
export function formatSizeMB(size: number): string {
  if (!size || isNaN(size)) return '';
  return `${(size / 1024 ** 2).toFixed(2)} MB`;
}

// Format a duration in seconds as HH:MM:SS
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}

// Convert a UTC date string to an IST Date object
export function getISTDate(dateString: string): Date {
  const date = new Date(dateString);
  // Get the UTC milliseconds
  const utcMillis = date.getTime();
  // IST is UTC+5:30, which is 5.5 hours * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second
  const istOffsetMillis = 5.5 * 60 * 60 * 1000;
  // Apply the offset to get the IST milliseconds
  const istMillis = utcMillis + istOffsetMillis;
  return new Date(istMillis);
}
