import { describe, expect, it } from 'vitest';
import {
  formatEstimatedUploadTime,
  getEstimatedUploadMbps,
  type NetworkInfo,
} from '../../../src/hooks/useNetworkStrength';

const createNetworkInfo = (
  overrides: Partial<NetworkInfo> = {},
): NetworkInfo => ({
  status: 'Excellent',
  effectiveType: '4g',
  downlink: null,
  rtt: 50,
  isOnline: true,
  ...overrides,
});

describe('useNetworkStrength helpers', () => {
  describe('getEstimatedUploadMbps', () => {
    it('uses downlink when it is present', () => {
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ downlink: 12.5 })),
      ).toBe(12.5);
    });

    it('uses fallback Mbps values by network status', () => {
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ status: 'Excellent' })),
      ).toBe(10);
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ status: 'Good' })),
      ).toBe(3);
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ status: 'Poor' })),
      ).toBe(0.7);
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ status: 'Very Poor' })),
      ).toBe(0.15);
    });

    it('returns no estimate for offline or unknown networks', () => {
      expect(
        getEstimatedUploadMbps(
          createNetworkInfo({ status: 'Offline', isOnline: false }),
        ),
      ).toBeNull();
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ status: 'Unknown' })),
      ).toBeNull();
    });
  });

  describe('formatEstimatedUploadTime', () => {
    it('formats seconds', () => {
      expect(formatEstimatedUploadTime(44.2)).toBe('~45 sec');
    });

    it('formats minutes', () => {
      expect(formatEstimatedUploadTime(121)).toBe('~3 min');
    });

    it('formats hours and minutes', () => {
      expect(formatEstimatedUploadTime(4_770)).toBe('~1 hr 20 min');
    });
  });
});
