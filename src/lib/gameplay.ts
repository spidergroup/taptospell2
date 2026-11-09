import { generateKeyboard } from '../data/words';
import {
  calculateInitialHints,
  type GameState,
  reconstructUsedKeyIndices,
} from './storage';

export { reconstructUsedKeyIndices, generateKeyboard, calculateInitialHints };

export interface TypeLetterResult {
  state: GameState;
  slotIndex: number;
}

export function initWordState(state: GameState): GameState {
  const currentWordObj = state.currentLevelWords[state.wordIndex];
  if (!currentWordObj) return state;

  const targetWord = currentWordObj.w;

  if (!state.filledSlots || state.filledSlots.length !== targetWord.length) {
    return {
      ...state,
      filledSlots: new Array(targetWord.length).fill(null),
      usedKeyIndices: new Array(targetWord.length).fill(null),
      hintsRemaining: calculateInitialHints(targetWord.length, state.level),
      showErrors: false,
      keyboardKeys: generateKeyboard(targetWord),
    };
  }

  if (!state.usedKeyIndices || state.usedKeyIndices.length !== targetWord.length) {
    return {
      ...state,
      usedKeyIndices: reconstructUsedKeyIndices(state.filledSlots, state.keyboardKeys),
    };
  }

  return state;
}

export function typeLetterState(
  state: GameState,
  char: string,
  keyIndex: number
): TypeLetterResult {
  const firstEmpty = state.filledSlots.indexOf(null);
  if (firstEmpty === -1) {
    return { state, slotIndex: -1 };
  }

  const nextSlots = [...state.filledSlots];
  const nextUsedKeys = [...(state.usedKeyIndices || new Array(nextSlots.length).fill(null))];

  nextSlots[firstEmpty] = char.toUpperCase();
  nextUsedKeys[firstEmpty] = keyIndex;

  return {
    state: {
      ...state,
      filledSlots: nextSlots,
      usedKeyIndices: nextUsedKeys,
    },
    slotIndex: firstEmpty,
  };
}

export const typeLetter = typeLetterState;

export function removeLetterState(state: GameState, slotIndex: number): GameState {
  if (
    slotIndex < 0 ||
    slotIndex >= state.filledSlots.length ||
    state.filledSlots[slotIndex] === null ||
    state.filledSlots[slotIndex] === undefined
  ) {
    return state;
  }

  const nextSlots = [...state.filledSlots];
  const nextUsedKeys = [...(state.usedKeyIndices || new Array(nextSlots.length).fill(null))];

  nextSlots[slotIndex] = null;
  nextUsedKeys[slotIndex] = null;

  return {
    ...state,
    filledSlots: nextSlots,
    usedKeyIndices: nextUsedKeys,
    showErrors: false,
  };
}

export const removeLetter = removeLetterState;

export interface SmartHintResult {
  state: GameState;
  applied: boolean;
  slotIndex: number;
  keyIndex: number;
}

export function applySmartHintState(state: GameState): SmartHintResult {
  if (state.hintsRemaining <= 0) {
    return { state, applied: false, slotIndex: -1, keyIndex: -1 };
  }

  const currentWordObj = state.currentLevelWords[state.wordIndex];
  if (!currentWordObj) {
    return { state, applied: false, slotIndex: -1, keyIndex: -1 };
  }

  const targetWord = currentWordObj.w;
  const nextSlots = [...state.filledSlots];
  const nextUsedKeys = [...(state.usedKeyIndices || new Array(targetWord.length).fill(null))];

  for (let i = 0; i < targetWord.length; i++) {
    if (nextSlots[i] !== targetWord[i]) {
      const neededChar = targetWord[i];
      // Clear any wrong letter currently at slot i
      nextSlots[i] = null;
      nextUsedKeys[i] = null;

      // Find an unused keyboard button matching neededChar
      let keyIndex = state.keyboardKeys.findIndex(
        (k, idx) => k === neededChar && !nextUsedKeys.includes(idx)
      );

      // Key reclamation: if all instances of neededChar are placed in other wrong slots, reclaim one
      if (keyIndex === -1) {
        const wrongSlotIdx = nextSlots.findIndex(
          (c, sIdx) => sIdx !== i && c === neededChar && c !== targetWord[sIdx]
        );
        if (wrongSlotIdx !== -1) {
          keyIndex = nextUsedKeys[wrongSlotIdx] ?? -1;
          nextSlots[wrongSlotIdx] = null;
          nextUsedKeys[wrongSlotIdx] = null;
        }
      }

      nextSlots[i] = neededChar;
      nextUsedKeys[i] = keyIndex !== -1 ? keyIndex : null;

      return {
        state: {
          ...state,
          filledSlots: nextSlots,
          usedKeyIndices: nextUsedKeys,
          hintsRemaining: state.hintsRemaining - 1,
          showErrors: false,
        },
        applied: true,
        slotIndex: i,
        keyIndex: keyIndex !== -1 ? keyIndex : -1,
      };
    }
  }

  return { state, applied: false, slotIndex: -1, keyIndex: -1 };
}

export const useHint = applySmartHintState;

export type PhysicalKeyAction =
  | { type: 'none' }
  | { type: 'type'; char: string; keyIndex: number }
  | { type: 'remove'; slotIndex: number };

export function resolvePhysicalKeyAction(state: GameState, key: string): PhysicalKeyAction {
  if (key === 'Backspace' || key === 'Delete') {
    for (let i = state.filledSlots.length - 1; i >= 0; i--) {
      if (state.filledSlots[i] !== null) {
        return { type: 'remove', slotIndex: i };
      }
    }
    return { type: 'none' };
  }

  if (/^[a-zA-Z]$/.test(key)) {
    const char = key.toUpperCase();
    const hasEmptySlot = state.filledSlots.includes(null);
    const usedKeys = state.usedKeyIndices || [];
    const unusedKeyIdx = state.keyboardKeys.findIndex(
      (k, idx) => k === char && !usedKeys.includes(idx)
    );

    if (hasEmptySlot && unusedKeyIdx !== -1) {
      return { type: 'type', char, keyIndex: unusedKeyIdx };
    }

    const lastFilledIdx = state.filledSlots.lastIndexOf(char);
    if (lastFilledIdx !== -1) {
      return { type: 'remove', slotIndex: lastFilledIdx };
    }
  }

  return { type: 'none' };
}

export const handlePhysicalKeyAction = resolvePhysicalKeyAction;

export type SpellingEvaluation = 'incomplete' | 'correct' | 'wrong';

export function evaluateSpelling(state: GameState): SpellingEvaluation {
  if (state.filledSlots.length === 0 || state.filledSlots.includes(null)) {
    return 'incomplete';
  }
  const currentWordObj = state.currentLevelWords[state.wordIndex];
  if (!currentWordObj) return 'incomplete';

  const currentSpelling = state.filledSlots.join('');
  return currentSpelling === currentWordObj.w ? 'correct' : 'wrong';
}
