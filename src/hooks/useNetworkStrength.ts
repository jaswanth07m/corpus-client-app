import { useState, useEffect } from 'react';

export type NetworkStatus =
  | 'Excellent'
  | 'Good'
  | 'Poor'
  | 'Very Poor'
  | 'Offline'
  | 'Unknown';

export interface NetworkInfo {
  status: NetworkStatus;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  isOnline: boolean;
}

const FALLBACK_UPLOAD_MBPS: Partial<Record<NetworkStatus, number>> = {
  Excellent: 10,
  Good: 3,
  Poor: 0.7,
  'Very Poor': 0.15,
};

type NetworkConnection = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

function getConnection(): NetworkConnection | null {
  const nav = navigator as Navigator & {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

function effectiveTypeToStatus(
  effectiveType: string | undefined,
): NetworkStatus {
  switch (effectiveType) {
    case '4g':
      return 'Excellent';
    case '3g':
      return 'Good';
    case '2g':
      return 'Poor';
    case 'slow-2g':
      return 'Very Poor';
    default:
      return 'Unknown';
  }
}

function buildNetworkInfo(): NetworkInfo {
  if (!navigator.onLine) {
    return {
      status: 'Offline',
      effectiveType: null,
      downlink: null,
      rtt: null,
      isOnline: false,
    };
  }
  const conn = getConnection();
  if (!conn) {
    return {
      status: 'Unknown',
      effectiveType: null,
      downlink: null,
      rtt: null,
      isOnline: true,
    };
  }
  return {
    status: effectiveTypeToStatus(conn.effectiveType),
    effectiveType: conn.effectiveType ?? null,
    downlink: conn.downlink ?? null,
    rtt: conn.rtt ?? null,
    isOnline: true,
  };
}

export function useNetworkStrength(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(buildNetworkInfo);

  useEffect(() => {
    const update = () => setNetworkInfo(buildNetworkInfo());
    const conn = getConnection();

    conn?.addEventListener('change', update);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    return () => {
      conn?.removeEventListener('change', update);
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return networkInfo;
}

export function getEstimatedUploadMbps(
  networkInfo: NetworkInfo,
): number | null {
  if (!networkInfo.isOnline || networkInfo.status === 'Offline') {
    return null;
  }

  if (networkInfo.downlink != null && networkInfo.downlink > 0) {
    return networkInfo.downlink;
  }

  return FALLBACK_UPLOAD_MBPS[networkInfo.status] ?? null;
}

export function formatEstimatedUploadTime(seconds: number): string {
  const roundedSeconds = Math.max(1, Math.ceil(seconds));

  if (roundedSeconds < 60) {
    return `~${roundedSeconds} sec`;
  }

  const minutes = Math.ceil(roundedSeconds / 60);
  if (minutes < 60) {
    return `~${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `~${hours} hr`;
  }

  return `~${hours} hr ${remainingMinutes} min`;
}
