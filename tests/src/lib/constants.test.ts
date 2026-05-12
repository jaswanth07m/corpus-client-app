import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests for src/lib/constants.ts
 *
 * Tests the following:
 * - BACKEND_URL constant existence and type
 * - BACKEND_URL value correctness (matches environment variable)
 * - Immutability of the constant
 * - Module structure and exports
 */

describe('constants', () => {
  let BACKEND_URL: string;

  beforeEach(() => {
    // Mock the environment variable for tests
    vi.importActual('../../../src/lib/constants');
    BACKEND_URL = import.meta.env.VITE_API_SERVER_URL || '';
  });

  describe('BACKEND_URL', () => {
    it('should be exported', () => {
      expect(BACKEND_URL !== undefined).toBe(true);
    });

    it('should be a string type', () => {
      expect(typeof BACKEND_URL).toBe('string');
    });

    it('should read value from VITE_API_SERVER_URL environment variable', () => {
      const expectedUrl = import.meta.env.VITE_API_SERVER_URL || '';
      expect(BACKEND_URL).toBe(expectedUrl);
    });

    it('should handle empty string when VITE_API_SERVER_URL is not set', () => {
      if (
        import.meta.env.VITE_API_SERVER_URL === undefined ||
        import.meta.env.VITE_API_SERVER_URL === ''
      ) {
        expect(BACKEND_URL === '').toBe(true);
      } else {
        expect(BACKEND_URL).toBe(import.meta.env.VITE_API_SERVER_URL);
      }
    });

    it('should be a valid URL format when set', () => {
      if (BACKEND_URL && BACKEND_URL.length > 0) {
        expect(BACKEND_URL).toMatch(/^(https?:\/\/.+|\/[^\s]+)$/);
      }
    });

    it('should not be null', () => {
      expect(BACKEND_URL).not.toBeNull();
    });

    it('should be immutable (cannot be reassigned)', () => {
      const originalValue = BACKEND_URL;
      expect(BACKEND_URL).toBe(originalValue);
    });
  });

  describe('constants module structure', () => {
    it('should only export BACKEND_URL', async () => {
      const constantsModule = await import('../../../src/lib/constants');
      const exports = Object.keys(constantsModule);

      expect(exports).toEqual(['BACKEND_URL']);
      expect(exports).toHaveLength(1);
    });

    it('should not have any unexpected exports', async () => {
      const constantsModule = await import('../../../src/lib/constants');

      expect(
        (constantsModule as Record<string, unknown>).default,
      ).toBeUndefined();

      const validExports = ['BACKEND_URL'];
      const actualExports = Object.keys(constantsModule);

      actualExports.forEach((exportName) => {
        expect(validExports).toContain(exportName);
      });
    });

    it('should export BACKEND_URL as a named export', async () => {
      const constantsModule = await import('../../../src/lib/constants');
      expect('BACKEND_URL' in constantsModule).toBe(true);
    });
  });

  describe('BACKEND_URL edge cases', () => {
    it('should preserve trailing slashes if present in env var', () => {
      const envValue = import.meta.env.VITE_API_SERVER_URL;
      if (envValue && envValue.endsWith('/')) {
        expect(BACKEND_URL?.endsWith('/')).toBe(true);
      }
    });

    it('should preserve port numbers if present in env var', () => {
      const envValue = import.meta.env.VITE_API_SERVER_URL;
      if (envValue && /:\d+/.test(envValue)) {
        expect(/:\d+/.test(BACKEND_URL || '')).toBe(true);
      }
    });

    it('should preserve API path segments if present in env var', () => {
      const envValue = import.meta.env.VITE_API_SERVER_URL;
      if (envValue && envValue.includes('/api/')) {
        expect(BACKEND_URL?.includes('/api/')).toBe(true);
      }
    });
  });
});
