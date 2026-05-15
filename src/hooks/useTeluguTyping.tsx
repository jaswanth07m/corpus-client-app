// src/hooks/useTeluguTyping.tsx

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import {
  initialize,
  transliterate,
  getSuggestions,
  getVowelCombinations,
  findBaseConsonant,
  Suggestion,
} from '../lib/teluguKeyboard';

// Interface for the state managed by the engine's ref
interface EngineState {
  prevChar: string;
  prevLen: number;
}

// Interface for the object returned by the hook
export interface UseTeluguTypingReturn {
  value: string;
  suggestions: Suggestion[];
  setValue: React.Dispatch<React.SetStateAction<string>>;
  inputProps: {
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  };
}

export function useTeluguTyping(
  onChange?: (value: string) => void,
): UseTeluguTypingReturn {
  const [value, setValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const engineState = useRef<EngineState>({
    prevChar: '',
    prevLen: 0,
  }).current;

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const nextCursorPos = useRef<number | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (nextCursorPos.current !== null && textareaRef.current) {
      const pos = nextCursorPos.current;
      textareaRef.current.selectionStart = pos;
      textareaRef.current.selectionEnd = pos;
      nextCursorPos.current = null;
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    textareaRef.current = e.target;
    setValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    const target = e.target as HTMLTextAreaElement;
    textareaRef.current = target;

    if (e.key.length > 1 || e.ctrlKey || e.altKey || e.metaKey) {
      engineState.prevChar = '';
      engineState.prevLen = 0;
      setSuggestions([]);
      return;
    }

    e.preventDefault();

    const str = engineState.prevChar + e.key;
    const result = transliterate(str);
    const convertedChar = result.str;

    // Capture these synchronously RIGHT NOW before any state changes
    const selectionStart = target.selectionStart ?? target.value.length;
    const selectionEnd = target.selectionEnd ?? target.value.length;

    const textBefore = target.value.substring(
      0,
      selectionStart - engineState.prevLen,
    );
    const textAfter = target.value.substring(selectionEnd);

    const newValue = textBefore + convertedChar + textAfter;
    const newCursorPos = textBefore.length + convertedChar.length;

    nextCursorPos.current = newCursorPos;

    // Immediately set cursor on the live element before React re-renders
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
      }
    });

    setValue(newValue);
    onChange?.(newValue);

    engineState.prevChar = str.substring(result.freezpos);
    engineState.prevLen = result.indic.length;

    const currentSequence = engineState.prevChar;
    if (!currentSequence) {
      setSuggestions([]);
      return;
    }

    const finalSuggestions: Suggestion[] = [];
    finalSuggestions.push(...getSuggestions(currentSequence));

    const baseConsonant = findBaseConsonant(currentSequence);
    if (baseConsonant) {
      const allCombinations = getVowelCombinations(baseConsonant);
      finalSuggestions.push(
        ...allCombinations.filter((s) => s.eng.startsWith(currentSequence)),
      );
    }

    const uniqueSuggestions = Array.from(
      new Map(finalSuggestions.map((item) => [item.indic, item])).values(),
    );
    setSuggestions(uniqueSuggestions);
  };

  return {
    value,
    suggestions,
    setValue,
    inputProps: {
      onChange: handleChange,
      onKeyDown: handleKeyDown,
    },
  };
}
