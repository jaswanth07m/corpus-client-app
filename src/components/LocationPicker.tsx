import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Navigation, Check, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LeafletIconPrototype {
  _getIconUrl?: string;
}

// Fix for default marker icon issue with webpack
delete (L.Icon.Default.prototype as LeafletIconPrototype)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onClose,
}) => {
  const { t } = useTranslation();
  const [position, setPosition] = useState<[number, number]>([17.385, 78.4867]); // Default to Hyderabad
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [focusPosition, setFocusPosition] = useState<[number, number] | null>(
    null,
  );
  const markerRef = useRef<L.Marker>(null);

  const FocusMapOnSearchResult = ({
    targetPosition,
  }: {
    targetPosition: [number, number] | null;
  }) => {
    const map = useMap();

    useEffect(() => {
      if (!targetPosition) return;
      map.flyTo(targetPosition, Math.max(map.getZoom(), 13), {
        animate: true,
      });
    }, [map, targetPosition]);

    return null;
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });

    return position === null ? null : (
      <Marker
        position={position}
        draggable={true}
        ref={markerRef}
        eventHandlers={{
          dragend: () => {
            const marker = markerRef.current;
            if (marker != null) {
              const { lat, lng } = marker.getLatLng();
              setPosition([lat, lng]);
            }
          },
        }}
      />
    );
  };

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
        // You can add a toast notification here to inform the user
      },
      { enableHighAccuracy: true },
    );
  };

  const handleConfirmLocation = () => {
    onLocationSelect(position[0], position[1]);
  };

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const debounceTimer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setSearchResults([]);
          return;
        }

        const data = (await response.json()) as NominatimResult[];
        setSearchResults(data);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = (result: NominatimResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    setPosition([lat, lng]);
    setFocusPosition([lat, lng]);
    setSearchQuery(result.display_name);
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('common.selectALocation')}</h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="mb-3 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.searchPlaceOrAddress')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(isSearching || searchResults.length > 0) && (
            <div className="absolute z-[1001] mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {isSearching && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {t('common.searching')}
                </div>
              )}
              {!isSearching &&
                searchResults.map((result) => (
                  <button
                    type="button"
                    key={result.place_id}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  >
                    {result.display_name}
                  </button>
                ))}
            </div>
          )}
        </div>
        <div style={{ height: '50vh', width: '100%' }}>
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <FocusMapOnSearchResult targetPosition={focusPosition} />
            <LocationMarker />
          </MapContainer>
        </div>
        <div className="mt-4 flex flex-col md:flex-row gap-2">
          <Button
            onClick={getCurrentLocation}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            {t('user.useMyCurrentLocation')}
          </Button>
          <Button
            onClick={handleConfirmLocation}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="mr-2 h-4 w-4" />
            {t('common.confirmLocation')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
