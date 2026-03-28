import '@testing-library/jest-dom';

// Mock ResizeObserver which is used by cmdk but not available in jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  disconnect() {}
  observe(target: Element, options?: ResizeObserverOptions) {}
  unobserve(target: Element) {}
};

// Mock scrollIntoView which is used by cmdk but not available in jsdom
Element.prototype.scrollIntoView = vi.fn();
