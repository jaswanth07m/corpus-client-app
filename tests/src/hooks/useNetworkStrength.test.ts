import { describe, expect, it } from 'vitest';
import {
  formatEstimatedUploadTime,
  getEstimatedUploadMbps,
  type NetworkInfo,
} from '../../../src/hooks/useNetworkStrength';

const createNetworkInfo = (
  overrides: Partial<NetworkInfo> = {},
): NetworkInfo => ({
  status: 'fast',
  downloadMbps: 20,
  connected: true,
  isOnline: true,
  lastUpdatedAt: Date.now(),
  ...overrides,
});

describe('useNetworkStrength helpers', () => {
  describe('getEstimatedUploadMbps', () => {
    it('returns upload estimate based on download Mbps (20% ratio)', () => {
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ downloadMbps: 10 })),
      ).toBe(2);
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ downloadMbps: 20 })),
      ).toBe(4);
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ downloadMbps: 50 })),
      ).toBe(10);
    });

    it('returns null when downloadMbps is not available', () => {
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ downloadMbps: null })),
      ).toBeNull();
    });

    it('returns null when not connected or offline', () => {
      expect(
        getEstimatedUploadMbps(
          createNetworkInfo({ connected: false, isOnline: false }),
        ),
      ).toBeNull();
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ isOnline: false })),
      ).toBeNull();
      expect(
        getEstimatedUploadMbps(createNetworkInfo({ connected: false })),
      ).toBeNull();
    });
  });

  describe('formatEstimatedUploadTime', () => {
    it('formats seconds', () => {
      expect(formatEstimatedUploadTime(44.2)).toBe('~44 sec');
    });

    it('formats minutes', () => {
      expect(formatEstimatedUploadTime(121)).toBe('~2 min');
    });

    it('formats hours and minutes', () => {
      expect(formatEstimatedUploadTime(4_770)).toBe('~1 hr 20 min');
    });
  });
});
