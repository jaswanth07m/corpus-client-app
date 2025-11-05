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

export function useTeluguTyping(): UseTeluguTypingReturn {
  const [value, setValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const engineState = useRef<EngineState>({
    prevChar: '',
    prevLen: 0,
  }).current;

  useEffect(() => {
    initialize();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
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

    const target = e.target as HTMLTextAreaElement;
    const { selectionStart, selectionEnd } = target;
    const textBefore = target.value.substring(
      0,
      selectionStart - engineState.prevLen,
    );
    const textAfter = target.value.substring(selectionEnd);

    const newValue = textBefore + convertedChar + textAfter;
    setValue(newValue);

    setTimeout(() => {
      target.selectionStart = target.selectionEnd =
        textBefore.length + convertedChar.length;
    }, 0);

    engineState.prevChar = str.substring(result.freezpos);
    engineState.prevLen = result.indic.length;

    const currentSequence = engineState.prevChar;
    if (!currentSequence) {
      setSuggestions([]);
      return;
    }

    const finalSuggestions: Suggestion[] = [];
    const prefixSuggestions = getSuggestions(currentSequence);
    finalSuggestions.push(...prefixSuggestions);

    const baseConsonant = findBaseConsonant(currentSequence);
    if (baseConsonant) {
      const allCombinations = getVowelCombinations(baseConsonant);
      const filteredCombinations = allCombinations.filter((s) =>
        s.eng.startsWith(currentSequence),
      );
      finalSuggestions.push(...filteredCombinations);
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
