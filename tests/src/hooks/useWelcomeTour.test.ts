import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWelcomeTour } from '../../../src/hooks/useWelcomeTour';
import * as driverModule from 'driver.js';
import * as reactRouterDom from 'react-router-dom';

const { localStorageMock } = vi.hoisted(() => {
  let store: Record<string, string> = {};
  return {
    localStorageMock: {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    },
  };
});

vi.stubGlobal('localStorage', localStorageMock);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock('driver.js', () => ({
  driver: vi.fn(),
}));

describe('useWelcomeTour', () => {
  const navigateMock = vi.fn();
  const driveMock = vi.fn();
  const moveNextMock = vi.fn();
  const movePreviousMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.useFakeTimers();

    vi.mocked(reactRouterDom.useNavigate).mockReturnValue(navigateMock);
    vi.mocked(reactRouterDom.useLocation).mockReturnValue({
      pathname: '/',
    } as unknown as reactRouterDom.Location);

    vi.mocked(driverModule.driver).mockReturnValue({
      drive: driveMock,
      moveNext: moveNextMock,
      movePrevious: movePreviousMock,
    } as unknown as driverModule.Driver);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes the driver securely with 15 explicit navigational steps mapped', () => {
    renderHook(() => useWelcomeTour());
    const driverCalls = vi.mocked(driverModule.driver).mock.calls;
    expect(driverCalls.length).toBe(1);

    const config = driverCalls[0][0] as Record<string, unknown>;
    expect((config?.steps as unknown[])?.length).toBe(15);
    expect(config?.showProgress).toBe(true);
    expect(config?.animate).toBe(true);
  });

  it('defers driver start actively setting localStorage when location is outside root dynamically', () => {
    vi.mocked(reactRouterDom.useLocation).mockReturnValue({
      pathname: '/upload',
    } as unknown as reactRouterDom.Location);

    const { result } = renderHook(() => useWelcomeTour());

    act(() => {
      result.current.startTour();
    });

    expect(localStorage.getItem('startTourNextLoad')).toBe('true');
    expect(navigateMock).toHaveBeenCalledWith('/');
    expect(driveMock).not.toHaveBeenCalled();
  });

  it('ignites driver aggressively when location hits root accurately', () => {
    vi.mocked(reactRouterDom.useLocation).mockReturnValue({
      pathname: '/',
    } as unknown as reactRouterDom.Location);

    const { result } = renderHook(() => useWelcomeTour());

    act(() => {
      result.current.startTour();
    });

    expect(driveMock).toHaveBeenCalled();
  });

  it('automatically drops back into driver mode continuously consuming localStorage tracking variables safely', () => {
    localStorage.setItem('startTourNextLoad', 'true');
    vi.mocked(reactRouterDom.useLocation).mockReturnValue({
      pathname: '/',
    } as unknown as reactRouterDom.Location);

    renderHook(() => useWelcomeTour());

    expect(localStorage.getItem('startTourNextLoad')).toBeNull();

    act(() => {
      vi.runAllTimers();
    });

    expect(driveMock).toHaveBeenCalled();
  });

  it('bypasses starting gracefully if driver instantiation natively fails returning blank limits', () => {
    vi.mocked(driverModule.driver).mockReturnValue(
      null as unknown as driverModule.Driver,
    );
    localStorage.setItem('startTourNextLoad', 'true');

    const { result } = renderHook(() => useWelcomeTour());

    act(() => {
      vi.runAllTimers();
      result.current.startTour();
    });

    // Should run smoothly without crashing despite object missing
    expect(driverModule.driver).toHaveBeenCalled();
  });

  it('sets welcome tour boolean correctly upon complete driver destruction gracefully', () => {
    renderHook(() => useWelcomeTour());

    const config = vi.mocked(driverModule.driver).mock.calls[0][0] as Record<
      string,
      unknown
    >;

    act(() => {
      (config.onDestroyed as () => void)();
    });

    expect(localStorage.getItem('welcomeTourCompleted')).toBe('true');
  });

  it('maps all route change step callbacks routing dynamically validating setTimeout execution closures securely', () => {
    renderHook(() => useWelcomeTour());

    const config = vi.mocked(driverModule.driver).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    const steps = config.steps as Array<{ popover: Record<string, unknown> }>;

    // Filter elements possessing interactive hooks
    const nextSteps = steps.filter((s) => s.popover?.onNextClick);
    const prevSteps = steps.filter((s) => s.popover?.onPrevClick);

    // Call all generic navigational steps immediately
    nextSteps.forEach((step) => {
      act(() => {
        (step.popover.onNextClick as () => void)();
      });
    });

    prevSteps.forEach((step) => {
      act(() => {
        (step.popover.onPrevClick as () => void)();
      });
    });

    // Should capture robust navigation calls tracking accurately
    expect(navigateMock).toHaveBeenCalled();

    // Resolve all mapped timeouts globally mapping to the driver's next/prev
    act(() => {
      vi.runAllTimers();
    });

    expect(moveNextMock).toHaveBeenCalledTimes(nextSteps.length);
    expect(movePreviousMock).toHaveBeenCalledTimes(prevSteps.length);
  });

  it('safely drops popover navigations resolving transparently without crashes navigating away if driver bounds natively drop', () => {
    vi.mocked(driverModule.driver).mockReturnValue(
      null as unknown as driverModule.Driver,
    );

    renderHook(() => useWelcomeTour());
    const config = vi.mocked(driverModule.driver).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    const steps = config.steps as Array<{ popover: Record<string, unknown> }>;

    // Grab valid target actions
    const step = steps.find((s) => s.popover?.onNextClick);
    const prevStep = steps.find((s) => s.popover?.onPrevClick);

    act(() => {
      (step?.popover.onNextClick as () => void)();
      (prevStep?.popover.onPrevClick as () => void)();
    });

    // Resolving without driver instantiated securely completes due to optimal optional chaining
    act(() => {
      vi.runAllTimers();
    });

    expect(navigateMock).toHaveBeenCalledTimes(2);
    expect(moveNextMock).not.toHaveBeenCalled();
    expect(movePreviousMock).not.toHaveBeenCalled();
  });
});
