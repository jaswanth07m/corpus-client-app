import { useState } from 'react';

interface GeolocationState {
  latitude: string;
  longitude: string;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = (initialLat = '', initialLng = '') => {
  const [state, setState] = useState<GeolocationState>({
    latitude: initialLat,
    longitude: initialLng,
    error: null,
    loading: false,
  });

  const getCurrentLocation = () => {
    setState((prev) => ({ ...prev, error: null, loading: true }));

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        loading: false,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'You denied the request for Geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
    );
  };

  const setCoordinates = (lat: string, lng: string) => {
    setState((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const setLatitude = (lat: string) => {
    setState((prev) => ({ ...prev, latitude: lat }));
  };

  const setLongitude = (lng: string) => {
    setState((prev) => ({ ...prev, longitude: lng }));
  };

  return {
    ...state,
    getCurrentLocation,
    setLatitude,
    setLongitude,
  };
};
