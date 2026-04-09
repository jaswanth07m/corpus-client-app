import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../../../src/hooks/useGeolocation';

describe('useGeolocation', () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  };

  const setupMockNavigator = () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });
  };

  const clearMockNavigator = () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes seamlessly with default empty string values', () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.latitude).toBe('');
    expect(result.current.longitude).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('initializes accurately with provided initial coordinate values', () => {
    const { result } = renderHook(() => useGeolocation('10.5', '20.8'));
    expect(result.current.latitude).toBe('10.5');
    expect(result.current.longitude).toBe('20.8');
  });

  it('updates target latitude gracefully using setLatitude natively', () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.setLatitude('45.0');
    });
    expect(result.current.latitude).toBe('45.0');
  });

  it('updates target longitude gracefully using setLongitude natively', () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.setLongitude('90.0');
    });
    expect(result.current.longitude).toBe('90.0');
  });

  it('handles missing geolocation native API dropping elegantly', () => {
    clearMockNavigator();
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      'Geolocation is not supported by your browser.',
    );
  });

  it('updates the loading state actively while awaiting native coordinates', () => {
    setupMockNavigator();
    const { result } = renderHook(() => useGeolocation());

    // Delay the mock to test the loading state transition
    let storedSuccess:
      | ((pos: { coords: { latitude: number; longitude: number } }) => void)
      | undefined;
    mockGeolocation.getCurrentPosition.mockImplementation((success, _error) => {
      storedSuccess = success;
    });

    act(() => {
      result.current.getCurrentLocation();
    });

    // Loading should be actively true before the success resolution
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    act(() => {
      storedSuccess!({ coords: { latitude: 77.7, longitude: 88.8 } });
    });

    // Loading closes immediately
    expect(result.current.loading).toBe(false);
    expect(result.current.latitude).toBe('77.7');
    expect(result.current.longitude).toBe('88.8');
  });

  it('handles PERMISSION_DENIED error mapping gracefully', () => {
    setupMockNavigator();
    const { result } = renderHook(() => useGeolocation());

    mockGeolocation.getCurrentPosition.mockImplementation(
      (_success, errorCb) => {
        errorCb({ code: 1, PERMISSION_DENIED: 1 });
      },
    );

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      'You denied the request for Geolocation.',
    );
  });

  it('handles POSITION_UNAVAILABLE error mapping gracefully', () => {
    setupMockNavigator();
    const { result } = renderHook(() => useGeolocation());

    mockGeolocation.getCurrentPosition.mockImplementation(
      (_success, errorCb) => {
        errorCb({ code: 2, POSITION_UNAVAILABLE: 2 });
      },
    );

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Location information is unavailable.');
  });

  it('handles TIMEOUT error mapping gracefully', () => {
    setupMockNavigator();
    const { result } = renderHook(() => useGeolocation());

    mockGeolocation.getCurrentPosition.mockImplementation(
      (_success, errorCb) => {
        errorCb({ code: 3, TIMEOUT: 3 });
      },
    );

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      'The request to get user location timed out.',
    );
  });

  it('handles unmapped unknown error limits tracking securely', () => {
    setupMockNavigator();
    const { result } = renderHook(() => useGeolocation());

    mockGeolocation.getCurrentPosition.mockImplementation(
      (_success, errorCb) => {
        errorCb({ code: 999 }); // No mapped matches
      },
    );

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('An unknown error occurred.');
  });

  it('updates both latitude and longitude gracefully using setCoordinates natively', () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.setCoordinates('77.1', '88.2');
    });
    expect(result.current.latitude).toBe('77.1');
    expect(result.current.longitude).toBe('88.2');
  });
});
