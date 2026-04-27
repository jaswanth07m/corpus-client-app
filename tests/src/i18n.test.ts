import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES } from '../../src/i18n';

describe('i18n', () => {
  it('exports supported languages list', () => {
    expect(SUPPORTED_LANGUAGES).toBeDefined();
    expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0);
  });

  it('contains english, telugu, and hindi', () => {
    const codes = SUPPORTED_LANGUAGES.map((lang) => lang.code);
    expect(codes).toContain('en');
    expect(codes).toContain('te');
    expect(codes).toContain('hi');
  });
});
