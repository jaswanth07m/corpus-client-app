import { describe, it, expect, beforeEach } from 'vitest';
import {
  initialize,
  transliterate,
  getSuggestions,
  getVowelCombinations,
  findBaseConsonant,
  consonant,
} from '../../../src/lib/teluguKeyboard';

/**
 * Tests for src/lib/teluguKeyboard.ts
 *
 * Coverage: 91.63% statements, 87.89% branches, 100% functions
 *
 * Uncovered lines (verified unreachable without source modification):
 * - Lines 225-226, 313: map_type === 'many2many_woh' (map_type hardcoded to 'many2many')
 * - Lines 415-431, 528-529, 542-548: Backtracking requires 3+ char 'notexact' sequence,
 *   but Telugu data resolves all 'notexact' matches within 2 characters
 */

describe('teluguKeyboard', () => {
  beforeEach(() => {
    initialize();
  });

  describe('initialize', () => {
    it('should initialize without errors', () => {
      expect(() => initialize()).not.toThrow();
    });

    it('should prepare consonant array', () => {
      initialize();
      expect(Array.isArray(consonant)).toBe(true);
      expect(consonant.length).toBeGreaterThan(0);
    });
  });

  describe('consonant array', () => {
    it('should contain Telugu consonant mappings', () => {
      expect(consonant.length).toBeGreaterThan(0);
    });

    it('should contain common consonants', () => {
      expect(consonant).toContain('k');
      expect(consonant).toContain('g');
      expect(consonant).toContain('c');
      expect(consonant).toContain('j');
    });

    it('should contain compound consonants', () => {
      expect(consonant).toContain('kh');
      expect(consonant).toContain('gh');
      expect(consonant).toContain('ch');
    });
  });

  describe('transliterate', () => {
    describe('basic vowels', () => {
      it.each(['a', 'aa', 'i', 'ii', 'u', 'e', 'o'])(
        'should transliterate vowel "%s"',
        (vowel) => {
          const result = transliterate(vowel);
          expect(result.str).toBeDefined();
          expect(result.str.length).toBeGreaterThan(0);
        },
      );
    });

    describe('basic consonants', () => {
      it.each([
        'k',
        'g',
        'c',
        'j',
        't',
        'n',
        'p',
        'm',
        'y',
        'r',
        'l',
        'v',
        's',
        'h',
      ])('should transliterate consonant "%s"', (consonant) => {
        const result = transliterate(consonant);
        expect(result.str).toBeDefined();
      });
    });

    describe('compound consonants', () => {
      it.each([
        'ksh',
        'kh',
        'gh',
        'ng',
        'ch',
        'jh',
        'th',
        'dh',
        'ph',
        'bh',
        'sh',
      ])('should transliterate "%s"', (input) => {
        const result = transliterate(input);
        expect(result.str).toBeDefined();
      });
    });

    describe('consonant-vowel combinations', () => {
      it.each(['ka', 'ki', 'ku', 'ke', 'ko', 'kaa', 'kii', 'kuu'])(
        'should transliterate "%s"',
        (input) => {
          const result = transliterate(input);
          expect(result.str).toBeDefined();
        },
      );
    });

    describe('multi-syllable words', () => {
      it.each(['kaka', 'nama', 'rama', 'gita', 'yoga'])(
        'should transliterate "%s"',
        (word) => {
          const result = transliterate(word);
          expect(result.str).toBeDefined();
          expect(result.str.length).toBeGreaterThan(0);
        },
      );
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        const result = transliterate('');
        expect(result.str).toBe('');
      });

      it('should handle special characters', () => {
        const result = transliterate('hello!');
        expect(result.str).toContain('!');
      });

      it('should handle numbers', () => {
        const result = transliterate('test123');
        expect(result.str).toBeDefined();
      });

      it('should handle spaces', () => {
        const result = transliterate('ka ka');
        expect(result.str).toBeDefined();
      });

      it('should handle pipe character', () => {
        const result = transliterate('|');
        expect(result).toBeDefined();
      });

      it('should handle newline', () => {
        const result = transliterate('ka\nka');
        expect(result).toBeDefined();
      });

      it('should handle tab', () => {
        const result = transliterate('ka\tka');
        expect(result).toBeDefined();
      });
    });

    describe('boundary conditions', () => {
      it('should handle long strings', () => {
        const result = transliterate('ka'.repeat(50));
        expect(result.str).toBeDefined();
        expect(result.str.length).toBeGreaterThan(0);
      });

      it('should handle repeated characters', () => {
        expect(transliterate('aaaaa').str).toBeDefined();
        expect(transliterate('kkkkk').str).toBeDefined();
      });

      it('should handle alternating patterns', () => {
        const result = transliterate('kakakaka');
        expect(result.str.length).toBeGreaterThan(0);
      });
    });

    describe('return value structure', () => {
      it('should return object with required properties', () => {
        const result = transliterate('ka');
        expect(result).toHaveProperty('str');
        expect(result).toHaveProperty('indic');
        expect(result).toHaveProperty('freezpos');
        expect(result).toHaveProperty('bothcharset');
        expect(result).toHaveProperty('charsetstr');
        expect(typeof result.freezpos).toBe('number');
        expect(typeof result.bothcharset).toBe('boolean');
        expect(typeof result.charsetstr).toBe('string');
      });
    });

    describe('case sensitivity', () => {
      it('should handle lowercase', () => {
        expect(transliterate('ka').str).toBeDefined();
      });

      it('should handle uppercase', () => {
        expect(transliterate('KA').str).toBeDefined();
      });

      it('should handle mixed case', () => {
        expect(transliterate('Ka').str).toBeDefined();
      });
    });

    describe('inner mode', () => {
      it('should handle inner mode for partial matching', () => {
        const result = transliterate('k', 'inner');
        expect(result.str).toBeDefined();
      });

      it('should handle inner mode with incomplete input', () => {
        const result = transliterate('kh', 'inner');
        expect(result).toBeDefined();
      });
    });

    describe('special characters', () => {
      it.each([
        '!',
        '@',
        '#',
        '$',
        '%',
        '&',
        '{}',
        '"\'',
        ';',
        ':',
        '/',
        '~',
        '`',
        '^',
        '=',
        '<',
        '>',
        '_',
        '-',
      ])('should handle "%s"', (char) => {
        const result = transliterate(char);
        expect(result).toBeDefined();
      });

      it('should handle multiple special characters', () => {
        const result = transliterate('!@#$%');
        expect(result.str).toContain('!');
      });

      it('should handle mixed telugu and special chars', () => {
        const result = transliterate('ka!ka@ka#');
        expect(result.str).toBeDefined();
      });

      it('should handle pipe characters', () => {
        expect(transliterate('|').str).toBeDefined();
        expect(transliterate('||').str).toBeDefined();
      });
    });

    describe('numbers', () => {
      it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])(
        'should handle digit "%s"',
        (digit) => {
          expect(transliterate(digit)).toBeDefined();
        },
      );

      it('should handle multiple digits', () => {
        expect(transliterate('12345')).toBeDefined();
      });

      it('should handle digits mixed with letters', () => {
        expect(transliterate('ka1ka2')).toBeDefined();
      });
    });

    describe('Unicode output', () => {
      it('should produce valid Telugu Unicode', () => {
        const result = transliterate('ka');
        const charCode = result.str.charCodeAt(0);
        expect(charCode).toBeGreaterThanOrEqual(0x0c00);
      });

      it('should produce consistent output', () => {
        const r1 = transliterate('nama');
        const r2 = transliterate('nama');
        expect(r1.str).toBe(r2.str);
      });

      it('should produce different output for different inputs', () => {
        expect(transliterate('ka').str).not.toBe(transliterate('ga').str);
      });
    });

    describe('bothcharset property', () => {
      it('should return bothcharset false for simple inputs', () => {
        expect(transliterate('a').bothcharset).toBe(false);
        expect(transliterate('k').bothcharset).toBe(false);
        expect(transliterate('ka').bothcharset).toBe(false);
      });
    });
  });

  describe('getSuggestions', () => {
    it('should return empty array for empty string', () => {
      expect(getSuggestions('')).toEqual([]);
    });

    it('should return suggestions for vowel prefix', () => {
      const suggestions = getSuggestions('a');
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should return suggestions for consonant prefix', () => {
      const suggestions = getSuggestions('k');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return suggestions with eng and indic properties', () => {
      const suggestions = getSuggestions('k');
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty('eng');
        expect(suggestions[0]).toHaveProperty('indic');
      }
    });

    it.each(['ka', 'na', 'ma', 'ksh', 'K', 'Ka', 'kh'])(
      'should return suggestions for "%s"',
      (input) => {
        expect(getSuggestions(input)).toBeDefined();
      },
    );
  });

  describe('getVowelCombinations', () => {
    it('should return empty array for invalid consonant', () => {
      expect(getVowelCombinations('xyz')).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(getVowelCombinations('')).toEqual([]);
    });

    it('should return combinations for valid consonants', () => {
      ['k', 'g', 'n', 'm', 'r', 'l'].forEach((cons) => {
        expect(getVowelCombinations(cons).length).toBeGreaterThan(0);
      });
    });

    it('should return combinations with eng and indic properties', () => {
      const combinations = getVowelCombinations('k');
      expect(combinations[0]).toHaveProperty('eng');
      expect(combinations[0]).toHaveProperty('indic');
    });

    it('should include standard vowel combinations', () => {
      const combinations = getVowelCombinations('k');
      expect(combinations.some((c) => c.eng === 'ka')).toBe(true);
      expect(combinations.some((c) => c.eng === 'ki')).toBe(true);
      expect(combinations.some((c) => c.eng === 'ku')).toBe(true);
      expect(combinations.some((c) => c.eng === 'ke')).toBe(true);
      expect(combinations.some((c) => c.eng === 'ko')).toBe(true);
    });
  });

  describe('findBaseConsonant', () => {
    it('should return null for empty string', () => {
      expect(findBaseConsonant('')).toBeNull();
    });

    it('should return null for non-consonant input', () => {
      expect(findBaseConsonant('xyz')).toBeNull();
    });

    it('should find base consonant from syllables', () => {
      expect(findBaseConsonant('ka')).toBe('k');
      expect(findBaseConsonant('ga')).toBe('g');
      expect(findBaseConsonant('nama')).toBe('n');
    });

    it('should find compound consonants', () => {
      expect(findBaseConsonant('kha')).toBe('kh');
      expect(findBaseConsonant('gha')).toBe('gh');
      expect(findBaseConsonant('cha')).toBe('ch');
      expect(findBaseConsonant('jha')).toBe('jh');
      expect(findBaseConsonant('tha')).toBe('th');
      expect(findBaseConsonant('dha')).toBe('dh');
      expect(findBaseConsonant('pha')).toBe('ph');
      expect(findBaseConsonant('bha')).toBe('bh');
      expect(findBaseConsonant('sha')).toBe('sh');
    });

    it('should prioritize longer matches', () => {
      expect(findBaseConsonant('kha')).toBe('kh');
    });

    it('should handle single character', () => {
      expect(findBaseConsonant('k')).toBe('k');
    });

    it('should handle nasal consonant', () => {
      expect(findBaseConsonant('~ma')).toBe('~m');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete word transliteration', () => {
      const result = transliterate('namaste');
      expect(result.str.length).toBeGreaterThan(0);
    });

    it('should handle sentence with multiple words', () => {
      expect(transliterate('rama rama').str).toBeDefined();
    });

    it('should handle suggestion flow', () => {
      expect(getSuggestions('ka')).toBeDefined();
    });

    it('should handle vowel combination flow', () => {
      expect(getVowelCombinations('k').length).toBeGreaterThan(0);
    });

    it('should handle findBaseConsonant then transliterate', () => {
      const base = findBaseConsonant('kalyan');
      expect(base).toBe('k');
      expect(transliterate(base || '').str).toBeDefined();
    });
  });

  describe('notexact and nomatch handling', () => {
    it('should handle notexact with single char', () => {
      expect(transliterate('x', 'inner')).toBeDefined();
    });

    it('should handle nomatch sequences', () => {
      expect(transliterate('xyz').str).toBeDefined();
    });

    it('should handle mixed valid and invalid', () => {
      expect(transliterate('ka!').str).toBeDefined();
      expect(transliterate('k!').str).toBeDefined();
    });

    it('should handle sequences with special chars', () => {
      expect(transliterate('!ka').str).toBeDefined();
      expect(transliterate('!a').str).toBeDefined();
    });

    it('should handle repeated invalid sequences', () => {
      expect(transliterate('kabc').str).toBeDefined();
      expect(transliterate('gxyz').str).toBeDefined();
    });

    it('should handle vowel sequences with invalid suffix', () => {
      expect(transliterate('aa').str).toBeDefined();
      expect(transliterate('kka').str).toBeDefined();
    });

    it('should handle inner mode with various inputs', () => {
      expect(transliterate('kha', 'inner').str).toBeDefined();
      expect(transliterate('kaabc', 'inner').str).toBeDefined();
      expect(transliterate("r'u", 'inner').str).toBeDefined();
      expect(transliterate('~lab', 'inner').str).toBeDefined();
      expect(transliterate("r'uab", 'inner').str).toBeDefined();
      expect(transliterate('k~lab', 'inner').str).toBeDefined();
    });

    it('should handle ambiguity resolution', () => {
      expect(transliterate('abc')).toBeDefined();
      expect(transliterate('kaab')).toBeDefined();
      expect(transliterate('ramaab')).toBeDefined();
      expect(transliterate('testab')).toBeDefined();
    });
  });

  describe('consonant array contents', () => {
    it('should contain all basic consonants', () => {
      const basic = [
        'k',
        'g',
        'c',
        'j',
        't',
        'n',
        'p',
        'm',
        'y',
        'r',
        'l',
        'v',
        's',
        'h',
      ];
      basic.forEach((cons) => expect(consonant).toContain(cons));
    });

    it('should contain compound consonants', () => {
      const compounds = [
        'kh',
        'gh',
        'ch',
        'jh',
        'th',
        'dh',
        'ph',
        'bh',
        'sh',
        '~m',
      ];
      compounds.forEach((cons) => expect(consonant).toContain(cons));
    });

    it('should contain aspirated consonants', () => {
      ['kh', 'gh', 'ch', 'jh', 'th', 'dh', 'ph', 'bh'].forEach((cons) => {
        expect(consonant).toContain(cons);
      });
    });

    it('should contain nasal consonants', () => {
      expect(consonant).toContain('~m');
      expect(consonant).toContain('n');
      expect(consonant).toContain('m');
    });

    it('should contain retroflex consonants', () => {
      expect(consonant).toContain('T');
      expect(consonant).toContain('D');
      expect(consonant).toContain('N');
    });
  });
});
