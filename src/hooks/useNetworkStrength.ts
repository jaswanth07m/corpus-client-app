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
