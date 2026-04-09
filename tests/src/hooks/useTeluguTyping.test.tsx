import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTeluguTyping } from '../../../src/hooks/useTeluguTyping';
import * as keyboardLib from '../../../src/lib/teluguKeyboard';
import { ChangeEvent, KeyboardEvent } from 'react';

vi.mock('../../../src/lib/teluguKeyboard', () => ({
  initialize: vi.fn(),
  transliterate: vi.fn(),
  getSuggestions: vi.fn(),
  getVowelCombinations: vi.fn(),
  findBaseConsonant: vi.fn(),
}));

describe('useTeluguTyping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes the keyboard engine successfully when mounted', () => {
    renderHook(() => useTeluguTyping());
    expect(keyboardLib.initialize).toHaveBeenCalledTimes(1);
  });

  it('updates text payload reliably when generic onChange triggers', () => {
    const { result } = renderHook(() => useTeluguTyping());

    act(() => {
      result.current.inputProps.onChange({
        target: { value: 'sample entry' },
      } as unknown as ChangeEvent<HTMLTextAreaElement>);
    });

    expect(result.current.value).toBe('sample entry');
  });

  it('provides a direct set accessor for external value mappings securely', () => {
    const { result } = renderHook(() => useTeluguTyping());

    act(() => {
      result.current.setValue('test fallback');
    });

    expect(result.current.value).toBe('test fallback');
  });

  it('clears sequence traces and actively bypasses transliteration mapped for navigational modifier keys', () => {
    const { result } = renderHook(() => useTeluguTyping());
    const eventMockControl = vi.fn();

    act(() => {
      result.current.inputProps.onKeyDown({
        key: 'Backspace', // length > 1
        preventDefault: eventMockControl,
      } as unknown as KeyboardEvent<HTMLTextAreaElement>);

      result.current.inputProps.onKeyDown({
        key: 'a',
        ctrlKey: true,
        preventDefault: eventMockControl,
      } as unknown as KeyboardEvent<HTMLTextAreaElement>);

      result.current.inputProps.onKeyDown({
        key: 's',
        altKey: true,
        preventDefault: eventMockControl,
      } as unknown as KeyboardEvent<HTMLTextAreaElement>);

      result.current.inputProps.onKeyDown({
        key: 'd',
        metaKey: true,
        preventDefault: eventMockControl,
      } as unknown as KeyboardEvent<HTMLTextAreaElement>);
    });

    expect(eventMockControl).not.toHaveBeenCalled();
    expect(keyboardLib.transliterate).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it('calculates the transliterated character correctly replacing the text natively via position bounds', () => {
    const { result } = renderHook(() => useTeluguTyping());

    vi.mocked(keyboardLib.transliterate).mockReturnValue({
      str: 'క',
      freezpos: 1, // Ends the sequence tracking
      indic: 'క',
      bothcharset: false,
      charsetstr: '',
    });

    const preventDefaultMock = vi.fn();
    const textAreaTarget = {
      value: 'hello ',
      selectionStart: 6,
      selectionEnd: 6,
    };

    act(() => {
      result.current.inputProps.onKeyDown({
        key: 'k',
        preventDefault: preventDefaultMock,
        target: textAreaTarget,
      } as unknown as KeyboardEvent<HTMLTextAreaElement>);
    });

    expect(preventDefaultMock).toHaveBeenCalled();
    expect(keyboardLib.transliterate).toHaveBeenCalledWith('k');
    expect(result.current.value).toBe('hello క');

    // Run queue to update browser cursor selection markers
    act(() => {
      vi.runAllTimers();
    });

    expect(textAreaTarget.selectionStart).toBe(7);
    expect(textAreaTarget.selectionEnd).toBe(7);

    // Because freezpos was 1, str.substring(1) == '', erasing sequence triggers empty suggestions array fallback
    expect(result.current.suggestions).toEqual([]);
  });

  it('maintains the current sequence strings and correctly filters overlapping unique vowel combinations', () => {
    const { result } = renderHook(() => useTeluguTyping());

    vi.mocked(keyboardLib.transliterate).mockReturnValue({
      str: 'క',
      freezpos: 0, // Prompts continuous active tracking ('k')
      indic: 'క',
      bothcharset: false,
      charsetstr: '',
    });

    vi.mocked(keyboardLib.getSuggestions).mockReturnValue([
      { eng: 'ka', indic: 'క' },
    ]);
    vi.mocked(keyboardLib.findBaseConsonant).mockReturnValue('k');
    vi.mocked(keyboardLib.getVowelCombinations).mockReturnValue([
      { eng: 'ka', indic: 'క' }, // Intentional duplicate output mock
      { eng: 'ku', indic: 'కు' }, // Matches strictly to current 'k' tree
      { eng: 'pa', indic: 'ప' }, // Must logically fail startsWith condition
    ]);

    const textAreaTarget = {
      value: '',
      selectionStart: 0,
      selectionEnd: 0,
    };

    act(() => {
      result.current.inputProps.onKeyDown({
        key: 'k',
        preventDefault: vi.fn(),
        target: textAreaTarget,
      } as unknown as KeyboardEvent<HTMLTextAreaElement>);
    });

    // Validates deduplication and startsWith string matching properly resolved array
    expect(result.current.suggestions).toEqual([
      { eng: 'ka', indic: 'క' },
      { eng: 'ku', indic: 'కు' },
    ]);
  });

  it('fetches suggestion limits accurately ignoring vowel combinations explicitly when no base consonant maps perfectly', () => {
    const { result } = renderHook(() => useTeluguTyping());

    vi.mocked(keyboardLib.transliterate).mockReturnValue({
      str: 'అ',
      freezpos: 0,
      indic: 'అ',
      bothcharset: false,
      charsetstr: '',
    });

    vi.mocked(keyboardLib.getSuggestions).mockReturnValue([
      { eng: 'a', indic: 'అ' },
    ]);
    vi.mocked(keyboardLib.findBaseConsonant).mockReturnValue(null); // Force base fallback

    const textAreaTarget = {
      value: '',
      selectionStart: 0,
      selectionEnd: 0,
    };

    act(() => {
      result.current.inputProps.onKeyDown({
        key: 'a',
        preventDefault: vi.fn(),
        target: textAreaTarget,
      } as unknown as KeyboardEvent<HTMLTextAreaElement>);
    });

    expect(keyboardLib.getVowelCombinations).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([{ eng: 'a', indic: 'అ' }]);
  });

  it('concatenates sequences mathematically dropping legacy texts for phonetic overlays dynamically', () => {
    const { result } = renderHook(() => useTeluguTyping());

    const textAreaTarget = {
      value: 'run ',
      selectionStart: 4,
      selectionEnd: 4,
    };

    // Initialize key hit mock
    vi.mocked(keyboardLib.transliterate).mockReturnValueOnce({
      str: 'క',
      freezpos: 0, // 'k'
      indic: 'క',
      bothcharset: false,
      charsetstr: '',
    });
    vi.mocked(keyboardLib.getSuggestions).mockReturnValue([]);
    vi.mocked(keyboardLib.findBaseConsonant).mockReturnValue(null);

    act(() => {
      result.current.inputProps.onKeyDown({
        key: 'k',
        preventDefault: vi.fn(),
        target: textAreaTarget,
      } as unknown as KeyboardEvent<HTMLTextAreaElement>);
    });

    // Simulate DOM input shifting bounds matching actual text tracking mathematically
    textAreaTarget.value = 'run క';
    textAreaTarget.selectionStart = 5;
    textAreaTarget.selectionEnd = 5;

    // Follow up character 'u' mock
    vi.mocked(keyboardLib.transliterate).mockReturnValueOnce({
      str: 'కు',
      freezpos: 2, // '' ending sequence
      indic: 'కు', // the new text component
      bothcharset: true,
      charsetstr: '',
    });

    act(() => {
      result.current.inputProps.onKeyDown({
        key: 'u',
        preventDefault: vi.fn(),
        target: textAreaTarget,
      } as unknown as KeyboardEvent<HTMLTextAreaElement>);
    });

    // Asserts 'run ' string properly concatenated dropping individual overlay
    expect(keyboardLib.transliterate).toHaveBeenLastCalledWith('ku');
    expect(result.current.value).toBe('run కు');
  });
});
