import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Polyfill ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    this.observe = vi.fn();

    this.unobserve = vi.fn();

    this.disconnect = vi.fn();
  }
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
