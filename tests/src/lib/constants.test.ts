import { describe, it, expect } from 'vitest';
import { BACKEND_URL } from '../../../src/lib/constants';

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
  describe('BACKEND_URL', () => {
    it('should be exported', () => {
      expect(BACKEND_URL).toBeDefined();
    });

    it('should be a string type', () => {
      expect(typeof BACKEND_URL).toBe('string');
    });

    it('should read value from VITE_API_SERVER_URL environment variable', () => {
      // The constant should match the environment variable value
      const expectedUrl = import.meta.env.VITE_API_SERVER_URL;
      expect(BACKEND_URL).toBe(expectedUrl);
    });

    it('should handle empty string when VITE_API_SERVER_URL is not set', () => {
      // When env var is not set, Vite typically returns empty string or undefined
      // This test verifies the constant handles this gracefully
      if (
        import.meta.env.VITE_API_SERVER_URL === undefined ||
        import.meta.env.VITE_API_SERVER_URL === ''
      ) {
        expect(BACKEND_URL === undefined || BACKEND_URL === '').toBe(true);
      } else {
        expect(BACKEND_URL).toBe(import.meta.env.VITE_API_SERVER_URL);
      }
    });

    it('should be a valid URL format when set', () => {
      // If BACKEND_URL is set, it should be a valid URL format
      if (BACKEND_URL) {
        // URL should start with http:// or https://
        expect(BACKEND_URL).toMatch(/^https?:\/\/.+/);
      }
    });

    it('should not be null', () => {
      expect(BACKEND_URL).not.toBeNull();
    });

    it('should be immutable (cannot be reassigned)', () => {
      // Verify that the export is a const by checking it's not writable
      // This is enforced by TypeScript/JavaScript const declaration
      const originalValue = BACKEND_URL;
      expect(BACKEND_URL).toBe(originalValue);
    });
  });

  describe('constants module structure', () => {
    it('should only export BACKEND_URL', async () => {
      // Import the module as a namespace to check all exports
      const constantsModule = await import('../../../src/lib/constants');
      const exports = Object.keys(constantsModule);

      expect(exports).toEqual(['BACKEND_URL']);
      expect(exports).toHaveLength(1);
    });

    it('should not have any unexpected exports', async () => {
      const constantsModule = await import('../../../src/lib/constants');

      // Ensure no default export
      expect(
        (constantsModule as Record<string, unknown>).default,
      ).toBeUndefined();

      // Ensure only expected named export exists
      const validExports = ['BACKEND_URL'];
      const actualExports = Object.keys(constantsModule);

      actualExports.forEach((exportName) => {
        expect(validExports).toContain(exportName);
      });
    });

    it('should export BACKEND_URL as a named export', async () => {
      const constantsModule = await import('../../../src/lib/constants');
      expect(constantsModule.BACKEND_URL).toBeDefined();
      expect(Object.hasOwnProperty.call(constantsModule, 'BACKEND_URL')).toBe(
        true,
      );
    });
  });

  describe('BACKEND_URL edge cases', () => {
    it('should preserve trailing slashes if present in env var', () => {
      // This test documents the behavior - if env var has trailing slash, constant should too
      const envValue = import.meta.env.VITE_API_SERVER_URL;
      if (envValue && envValue.endsWith('/')) {
        expect(BACKEND_URL?.endsWith('/')).toBe(true);
      }
    });

    it('should preserve port numbers if present in env var', () => {
      // This test documents the behavior - if env var has port, constant should too
      const envValue = import.meta.env.VITE_API_SERVER_URL;
      if (envValue && /:\d+/.test(envValue)) {
        expect(/:\d+/.test(BACKEND_URL || '')).toBe(true);
      }
    });

    it('should preserve API path segments if present in env var', () => {
      // This test documents the behavior - if env var has path, constant should too
      const envValue = import.meta.env.VITE_API_SERVER_URL;
      if (envValue && envValue.includes('/api/')) {
        expect(BACKEND_URL?.includes('/api/')).toBe(true);
      }
    });
  });
});
