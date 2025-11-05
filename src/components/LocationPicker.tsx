import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Check, Loader2, X } from 'lucide-react';

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

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onClose,
}) => {
  const [position, setPosition] = useState<[number, number]>([17.385, 78.4867]); // Default to Hyderabad
  const [loading, setLoading] = useState(false);
  const markerRef = useRef<L.Marker>(null);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select a Location</h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
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
            Use My Current Location
          </Button>
          <Button
            onClick={handleConfirmLocation}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="mr-2 h-4 w-4" />
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
