import { useCallback, useEffect, useMemo, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}

function FitBounds({ data }: { data: FlatContribution[] }) {
  const map = useMap();
  useEffect(() => {
    if (!data.length) {
      map.setView([17.385044, 78.486671], 10);
      return;
    }
    const L = (window as any).L ?? require('leaflet');
    const bounds = data.map(
      (c) => [c.location.latitude, c.location.longitude] as [number, number],
    );
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });
  }, [map, data]);
  return null;
}

function GeoMapContent({ userIdentifier }: { userIdentifier: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } =
    useContributionGeo(userIdentifier);

  const markers = useMemo(() => {
    if (!data) return null;
    return data.map((c: FlatContribution) => {
      const color = MEDIA_TYPE_COLORS[c.media_type] ?? '#666';
      const label = MEDIA_TYPE_LABELS[c.media_type] ?? c.media_type;
      const date = formatContributionDate(c.timestamp);
      return (
        <CircleMarker
          key={c.id}
          center={[c.location.latitude, c.location.longitude]}
          radius={10}
          fillOpacity={0.85}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: color }}
        >
          <Popup>
            <div style={{ fontFamily: 'inherit', padding: '2px 0' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                {c.title}
              </p>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: '#64748b' }}>
                <span
                  style={{
                    display: 'inline-block', width: 8, height: 8,
                    borderRadius: '50%', background: color,
                    marginRight: 4, verticalAlign: 'middle',
                  }}
                />
                Type: {label}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Date: {date}</p>
            </div>
          </Popup>
        </CircleMarker>
      );
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl bg-slate-100">
        <span className="text-sm text-slate-500">{t('messages.loadingMap')}</span>
      </div>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : t('common.couldNotLoadContributions');
    return (
      <div className="flex h-[520px] flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100 px-6 text-center">
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
      <div className="flex h-[520px] flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100">
        <MapPin className="h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">{t('common.noGeotaggedContributionsYet')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        dragging
        scrollWheelZoom
        doubleClickZoom
        touchZoom
        className="h-[520px] w-full geo-map-container"
      >
        <MapResizer />
        <FitBounds data={data} />
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
            <span className="text-xs text-slate-600">{MEDIA_TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeoContributionModal({ userIdentifier, open, onClose }: GeoContributionModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const handleOverlay = useCallback(
    (e: MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); },
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
        className="w-full max-w-[95vw] sm:max-w-[900px] max-h-[95vh] overflow-auto rounded-2xl bg-white p-4 shadow-2xl"
        style={{ animation: 'geoSlideIn 180ms ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="geo-modal-title" className="text-lg font-semibold text-slate-900">
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
