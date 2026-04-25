import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mergeOptionsMock,
  mockMapEvents,
  markerState,
  markerInstance,
  markerMockConfig,
} = vi.hoisted(() => ({
  mergeOptionsMock: vi.fn(),
  mockMapEvents: {} as {
    click?: (event: { latlng: { lat: number; lng: number } }) => void;
  },
  markerState: {
    lastPosition: null as [number, number] | null,
    dragend: null as null | (() => void),
  },
  markerInstance: {
    getLatLng: vi.fn(() => ({ lat: 0, lng: 0 })),
  },
  markerMockConfig: {
    assignRef: true,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: {
          _getIconUrl: 'mock-icon-url',
        },
        mergeOptions: mergeOptionsMock,
      },
    },
  },
}));

vi.mock('react-leaflet', async () => {
  const React = await import('react');

  return {
    MapContainer: ({
      center,
      children,
    }: {
      center: [number, number];
      children: React.ReactNode;
    }) => (
      <div data-testid="map-container" data-center={center.join(',')}>
        {children}
      </div>
    ),
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: React.forwardRef(
      (
        props: {
          position: [number, number];
          eventHandlers?: { dragend?: () => void };
        },
        ref: React.ForwardedRef<{
          getLatLng: () => { lat: number; lng: number };
        }>,
      ) => {
        markerState.lastPosition = props.position;
        markerState.dragend = props.eventHandlers?.dragend ?? null;

        if (markerMockConfig.assignRef && ref && typeof ref === 'object') {
          ref.current = markerInstance;
        }

        return (
          <div data-testid="marker" data-position={props.position.join(',')} />
        );
      },
    ),
    useMap: () => ({
      flyTo: vi.fn(),
      fitBounds: vi.fn(),
      setView: vi.fn(),
    }),
    useMapEvents: (handlers: typeof mockMapEvents) => {
      mockMapEvents.click = handlers.click;
      return {};
    },
  };
});

import LocationPicker from '@/components/LocationPicker';

describe('LocationPicker', () => {
  const onLocationSelect = vi.fn();
  const onClose = vi.fn();
  const getCurrentPosition = vi.fn();
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  beforeEach(() => {
    onLocationSelect.mockReset();
    onClose.mockReset();
    getCurrentPosition.mockReset();
    markerInstance.getLatLng.mockReset();
    markerInstance.getLatLng.mockReturnValue({ lat: 0, lng: 0 });
    markerState.lastPosition = null;
    markerState.dragend = null;
    markerMockConfig.assignRef = true;
    mockMapEvents.click = undefined;

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition,
      },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it('renders the modal with the default location and lets the user close or confirm it', () => {
    render(
      <LocationPicker onLocationSelect={onLocationSelect} onClose={onClose} />,
    );

    expect(screen.getByText('common.selectALocation')).toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toHaveAttribute(
      'data-center',
      '17.385,78.4867',
    );
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    expect(screen.getByTestId('marker')).toHaveAttribute(
      'data-position',
      '17.385,78.4867',
    );
    expect(mergeOptionsMock).toHaveBeenCalledWith({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    const [closeButton, currentLocationButton, confirmButton] =
      screen.getAllByRole('button');

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(confirmButton);
    expect(onLocationSelect).toHaveBeenCalledWith(17.385, 78.4867);
    expect(currentLocationButton).toHaveTextContent(
      'user.useMyCurrentLocation',
    );
  });

  it('updates the selected coordinates from map clicks and marker drag events', async () => {
    render(
      <LocationPicker onLocationSelect={onLocationSelect} onClose={onClose} />,
    );

    expect(mockMapEvents.click).toBeTypeOf('function');

    mockMapEvents.click?.({
      latlng: { lat: 12.34, lng: 56.78 },
    });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toHaveAttribute(
        'data-center',
        '12.34,56.78',
      );
    });

    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onLocationSelect).toHaveBeenLastCalledWith(12.34, 56.78);

    markerInstance.getLatLng.mockReturnValue({
      lat: 22.22,
      lng: 33.33,
    });
    markerState.dragend?.();

    await waitFor(() => {
      expect(screen.getByTestId('marker')).toHaveAttribute(
        'data-position',
        '22.22,33.33',
      );
    });

    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onLocationSelect).toHaveBeenLastCalledWith(22.22, 33.33);
  });

  it('uses the current browser location and shows a loading state while waiting', async () => {
    let successCallback:
      | ((position: {
          coords: { latitude: number; longitude: number };
        }) => void)
      | undefined;

    getCurrentPosition.mockImplementationOnce((success, _error, options) => {
      successCallback = success;
      expect(options).toEqual({ enableHighAccuracy: true });
    });

    render(
      <LocationPicker onLocationSelect={onLocationSelect} onClose={onClose} />,
    );

    const currentLocationButton = screen.getAllByRole('button')[1];

    fireEvent.click(currentLocationButton);

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(currentLocationButton).toBeDisabled();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    successCallback?.({
      coords: {
        latitude: 10.1,
        longitude: 20.2,
      },
    });

    await waitFor(() => {
      expect(currentLocationButton).not.toBeDisabled();
    });

    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onLocationSelect).toHaveBeenLastCalledWith(10.1, 20.2);
  });

  it('handles geolocation errors, logs them, and keeps the last valid position', async () => {
    let errorCallback: ((error: GeolocationPositionError) => void) | undefined;
    const geolocationError = {
      code: 1,
      message: 'permission denied',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError;

    getCurrentPosition.mockImplementationOnce((_success, error) => {
      errorCallback = error;
    });

    render(
      <LocationPicker onLocationSelect={onLocationSelect} onClose={onClose} />,
    );

    const currentLocationButton = screen.getAllByRole('button')[1];

    fireEvent.click(currentLocationButton);
    expect(currentLocationButton).toBeDisabled();

    errorCallback?.(geolocationError);

    await waitFor(() => {
      expect(currentLocationButton).not.toBeDisabled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(geolocationError);

    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onLocationSelect).toHaveBeenLastCalledWith(17.385, 78.4867);
  });

  it('ignores marker drag events when the marker ref is unavailable', () => {
    markerMockConfig.assignRef = false;

    render(
      <LocationPicker onLocationSelect={onLocationSelect} onClose={onClose} />,
    );

    expect(() => markerState.dragend?.()).not.toThrow();

    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onLocationSelect).toHaveBeenCalledWith(17.385, 78.4867);
  });
});
