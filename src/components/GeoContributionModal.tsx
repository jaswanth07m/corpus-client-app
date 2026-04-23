import { useCallback, useEffect, useMemo, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useContributionGeo } from '@/hooks/useContributionGeo';
import type { FlatContribution } from '@/types/geo';
import {
  MEDIA_TYPE_COLORS,
  MEDIA_TYPE_LABELS,
  formatContributionDate,
} from '@/lib/geoUtils';

interface GeoContributionModalProps {
  userIdentifier: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Must live inside <MapContainer>. Calls invalidateSize() after the modal's
 * CSS transition finishes so Leaflet recalculates tile layout correctly.
 */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}

function GeoMapContent({ userIdentifier }: { userIdentifier: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } =
    useContributionGeo(userIdentifier);

  const markers = useMemo(() => {
    if (!data) return [];
    return data.map((contribution: FlatContribution) => (
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
        <Popup className="geo-popup" maxWidth={500} minWidth={300}>
          <div className="p-1">
            <p className="text-base font-bold text-slate-900 leading-tight">
              {contribution.title}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-600 capitalize">
              {MEDIA_TYPE_LABELS[contribution.media_type]} ·{' '}
              {formatContributionDate(contribution.timestamp)}
            </p>
          </div>
        </Popup>
      </CircleMarker>
    ));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-2xl bg-slate-100">
        <span className="text-sm text-slate-500">
          {t('messages.loadingMap')}
        </span>
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error
        ? error.message
        : t('common.couldNotLoadContributions');
    return (
      <div className="flex h-[350px] flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm font-medium text-slate-700">{message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100">
        <MapPin className="h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">
          {t('common.noGeotaggedContributionsYet')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer
        center={[17.385, 78.4867]}
        zoom={6}
        dragging={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        className="h-[350px] w-full geo-map-container"
        style={{ cursor: 'grab' }}
      >
        <MapResizer />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers}
      </MapContainer>

      <div className="flex flex-wrap gap-4 border-t border-slate-200 bg-white px-4 py-3">
        {Object.keys(MEDIA_TYPE_COLORS).map((type) => (
          <div key={type} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: MEDIA_TYPE_COLORS[type] }}
            />
            <span className="text-xs text-slate-600">
              {MEDIA_TYPE_LABELS[type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeoContributionModal({
  userIdentifier,
  open,
  onClose,
}: GeoContributionModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const handleOverlay = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="geo-modal-title"
      onClick={handleOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ animation: 'geoFadeIn 180ms ease-out' }}
    >
      <style>{`
        @keyframes geoFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes geoSlideIn { from { opacity: 0; transform: translateY(10px) scale(0.98); }
                                to   { opacity: 1; transform: translateY(0)    scale(1);    } }
      `}</style>

      <div
        className="w-full max-w-[700px] max-h-[90vh] overflow-auto rounded-2xl bg-white p-4 shadow-2xl"
        style={{ animation: 'geoSlideIn 180ms ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="geo-modal-title"
            className="text-lg font-semibold text-slate-900"
          >
            {t('stats.myContributionsOnTheMap')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.closeMap')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <GeoMapContent userIdentifier={userIdentifier} />
      </div>
    </div>
  );
}

export default GeoContributionModal;
