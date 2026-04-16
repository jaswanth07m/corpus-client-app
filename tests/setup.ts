import { vi } from 'vitest';
import '@testing-library/jest-dom';

const createStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

Object.defineProperty(globalThis, 'localStorage', {
  value: createStorageMock(),
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: createStorageMock(),
  writable: true,
  configurable: true,
});

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
