import { useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useNetworkStrength,
  type NetworkStatus,
} from '@/hooks/useNetworkStrength';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ── Status → display config ───────────────────────────────────────────────────
// Colors driven by @cloudflare/speedtest download Mbps:
//   fast   (> 20 Mbps) → green
//   medium (> 5 Mbps)  → yellow
//   slow   (≤ 5 Mbps)  → red
//   offline / unknown  → gray

const STATUS_CONFIG: Record<
  NetworkStatus,
  { label: string; color: string; bars: number }
> = {
  fast: { label: 'Fast', color: 'text-green-500', bars: 4 },
  medium: { label: 'Medium', color: 'text-yellow-500', bars: 3 },
  slow: { label: 'Slow', color: 'text-red-500', bars: 1 },
  offline: { label: 'Offline', color: 'text-gray-400', bars: 0 },
  unknown: { label: 'Checking', color: 'text-gray-400', bars: 0 },
};

const BAR_HEIGHTS = ['h-2', 'h-3', 'h-4', 'h-5'];

function SignalBars({
  activeBars,
  color,
}: {
  activeBars: number;
  color: string;
}) {
  return (
    <div className="flex items-end gap-[2px]">
      {BAR_HEIGHTS.map((height, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-sm ${height} transition-colors duration-500 ${
            i < activeBars ? color.replace('text-', 'bg-') : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export function NetworkStrengthIndicator() {
  const { t } = useTranslation();
  const { status, downloadMbps, isOnline } = useNetworkStrength();
  const config = STATUS_CONFIG[status];
  const [open, setOpen] = useState(false);

  // Format Mbps for tooltip — comes from @cloudflare/speedtest, not navigator.connection
  const mbpsLabel =
    downloadMbps != null
      ? `${downloadMbps < 1 ? downloadMbps.toFixed(2) : downloadMbps.toFixed(1)} Mbps`
      : null;

  const tooltipContent = (
    <div className="text-xs space-y-1">
      <p className="font-semibold">{config.label}</p>
      {mbpsLabel && (
        <p>
          {t('common.downlink', 'Speed: ')}
          {mbpsLabel}
        </p>
      )}
      {!isOnline && <p>{t('common.offline', 'No internet connection')}</p>}
      {status === 'unknown' && isOnline && (
        <p>{t('common.measuring', 'Measuring speed…')}</p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors duration-500 hover:bg-slate-50 ${config.color}`}
            aria-label={`Network: ${config.label}`}
            onClick={() => setOpen((v) => !v)}
          >
            {status === 'offline' || status === 'unknown' ? (
              <WifiOff className="w-5 h-5 transition-colors duration-500" />
            ) : (
              <SignalBars activeBars={config.bars} color={config.color} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
