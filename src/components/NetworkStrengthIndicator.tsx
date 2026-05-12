import React, { useState } from 'react';
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

const STATUS_CONFIG: Record<
  NetworkStatus,
  { label: string; color: string; bars: number }
> = {
  Excellent: { label: 'Excellent', color: 'text-green-500', bars: 4 },
  Good: { label: 'Good', color: 'text-yellow-500', bars: 3 },
  Poor: { label: 'Poor', color: 'text-orange-500', bars: 2 },
  'Very Poor': { label: 'Very Poor', color: 'text-red-500', bars: 1 },
  Offline: { label: 'Offline', color: 'text-gray-400', bars: 0 },
  Unknown: { label: 'Unknown', color: 'text-gray-400', bars: 0 },
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
          className={`w-[3px] rounded-sm ${height} ${
            i < activeBars ? color.replace('text-', 'bg-') : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export function NetworkStrengthIndicator() {
  const translation = useTranslation();
  const translate =
    typeof translation?.t === 'function'
      ? translation.t
      : (key: string, defaultValue?: string) => defaultValue ?? key;
  const { status, effectiveType, downlink, rtt } = useNetworkStrength();
  const config = STATUS_CONFIG[status];
  const [open, setOpen] = useState(false);

  const tooltipContent = (
    <div className="text-xs space-y-1">
      <p className="font-semibold">{config.label}</p>
      {effectiveType && <p>Type: {effectiveType}</p>}
      {downlink != null && (
        <p>
          {translate('common.downlink', 'Downlink: ')}
          {downlink} Mbps
        </p>
      )}
      {rtt != null && (
        <p>
          {translate('common.rtt', 'RTT: ')}
          {rtt} ms
        </p>
      )}
      {!effectiveType && status !== 'Offline' && (
        <p>{translate('common.apiNotSupported', 'API not supported')}</p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors hover:bg-slate-50 ${config.color}`}
            aria-label={`Network: ${config.label}`}
            onClick={() => setOpen((v) => !v)}
          >
            {status === 'Offline' || status === 'Unknown' ? (
              <WifiOff className="w-5 h-5" />
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
