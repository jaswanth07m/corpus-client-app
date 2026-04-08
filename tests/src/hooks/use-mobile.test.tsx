import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { useIsMobile } from '../../../src/hooks/use-mobile';

describe('useIsMobile', () => {
  let addEventListenerMock: Mock;
  let removeEventListenerMock: Mock;

  beforeEach(() => {
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const setInnerWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  it('should return false when window.innerWidth is greater than or equal to MOBILE_BREAKPOINT (768)', () => {
    setInnerWidth(1024);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('should return true when window.innerWidth is less than MOBILE_BREAKPOINT (768)', () => {
    setInnerWidth(500);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('should add change event listener to matchMedia', () => {
    const { unmount } = renderHook(() => useIsMobile());

    expect(addEventListenerMock).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    unmount();
    expect(removeEventListenerMock).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('should update isMobile state when resize occurs', () => {
    setInnerWidth(1024);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Extract the onChange callback added to matchMedia
    const changeCallback = addEventListenerMock.mock.calls[0][1];

    // Simulate window resize to mobile
    act(() => {
      setInnerWidth(600);
      changeCallback();
    });

    expect(result.current).toBe(true);

    // Simulate window resize back to desktop
    act(() => {
      setInnerWidth(800);
      changeCallback();
    });

    expect(result.current).toBe(false);
  });
});
