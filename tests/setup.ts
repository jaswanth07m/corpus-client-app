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
// Polyfill for Radix UI pointer events
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = function () {
    return false;
  };
  Element.prototype.setPointerCapture = function () {};
  Element.prototype.releasePointerCapture = function () {};
  Element.prototype.scrollIntoView = function () {};
}

if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.scrollIntoView = function () {};
}
