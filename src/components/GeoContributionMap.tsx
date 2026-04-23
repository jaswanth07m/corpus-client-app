import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useContributionGeo } from '@/hooks/useContributionGeo';
import type { FlatContribution } from '@/types/geo';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, shadowUrl });

const MEDIA_TYPE_COLORS: Record<string, string> = {
  audio: '#1D9E75',
  video: '#378ADD',
  text: '#534AB7',
  image: '#BA7517',
  document: '#D85A30',
};

const MEDIA_TYPE_LABELS: Record<string, string> = {
  audio: 'Audio',
  video: 'Video',
  text: 'Text',
  image: 'Image',
  document: 'Document',
};

interface GeoContributionMapProps {
  userIdentifier: string;
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function GeoContributionMap({ userIdentifier }: GeoContributionMapProps) {
  const { data, isLoading, isError, refetch } =
    useContributionGeo(userIdentifier);

  if (isLoading) {
    return (
      <div
        style={{
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: 12,
          fontSize: 14,
          color: '#888',
        }}
      >
        Loading map...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          height: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: 12,
          gap: 12,
        }}
      >
        <span style={{ fontSize: 14, color: '#888' }}>
          Could not load contributions.
        </span>
        <button
          onClick={() => refetch()}
          style={{
            fontSize: 12,
            padding: '6px 16px',
            borderRadius: 8,
            border: '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: 12,
          fontSize: 14,
          color: '#888',
        }}
      >
        No geotagged contributions yet.
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        marginTop: 16,
      }}
    >
      <MapContainer
        center={[17.385, 78.4867]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((contribution: FlatContribution) => (
          <CircleMarker
            key={contribution.id}
            center={[
              contribution.location.latitude,
              contribution.location.longitude,
            ]}
            radius={8}
            fillOpacity={0.8}
            pathOptions={{
              color: MEDIA_TYPE_COLORS[contribution.media_type],
              fillColor: MEDIA_TYPE_COLORS[contribution.media_type],
            }}
          >
            <Popup>
              <div style={{ fontSize: 13 }}>
                <strong>{contribution.title}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {contribution.media_type} · {formatDate(contribution.timestamp)}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '10px 16px',
          background: 'white',
          borderTop: '1px solid #eee',
        }}
      >
        {Object.keys(MEDIA_TYPE_COLORS).map((type) => (
          <div
            key={type}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: MEDIA_TYPE_COLORS[type],
              }}
            />
            <span style={{ fontSize: 12, color: '#666' }}>
              {MEDIA_TYPE_LABELS[type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GeoContributionMap;
