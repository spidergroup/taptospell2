import { describe, expect, it } from 'vitest';
import {
  applySmartHintState,
  calculateInitialHints,
  evaluateSpelling,
  initWordState,
  removeLetterState,
  resolvePhysicalKeyAction,
  typeLetterState,
} from './gameplay';
import { createInitialGameState, type GameState } from './storage';

function makeTestState(targetWord: string, keyboardKeys: string[]): GameState {
  return {
    ...createInitialGameState(2),
    isActive: true,
    category: 'Grade 2',
    grade: 2,
    level: 1,
    currentLevelWords: [{ w: targetWord, i: '🐑' }],
    wordIndex: 0,
    keyboardKeys,
    filledSlots: new Array(targetWord.length).fill(null),
    usedKeyIndices: new Array(targetWord.length).fill(null),
    hintsRemaining: Math.max(0, targetWord.length - 1),
    showErrors: false,
  };
}

describe('gameplay.ts — Duplicate-Key Tracking, Smart Hints & Physical Keyboard', () => {
  it('tracks duplicate letter keys independently via usedKeyIndices', () => {
    // Word: SHEEP (two E keys at indices 1 and 4)
    const keys = ['S', 'E', 'H', 'P', 'E', 'A', 'B', 'C', 'D', 'F', 'G', 'I'];
    let state = makeTestState('SHEEP', keys);

    // Click first 'E' at keyIndex 1 -> goes to slot 0
    const step1 = typeLetterState(state, 'E', 1);
    state = step1.state;
    expect(step1.slotIndex).toBe(0);
    expect(state.filledSlots[0]).toBe('E');
    expect(state.usedKeyIndices[0]).toBe(1);
    // Second 'E' at keyIndex 4 is not in usedKeyIndices
    expect(state.usedKeyIndices.includes(4)).toBe(false);

    // Click second 'E' at keyIndex 4 -> goes to slot 1
    const step2 = typeLetterState(state, 'E', 4);
    state = step2.state;
    expect(step2.slotIndex).toBe(1);
    expect(state.filledSlots[1]).toBe('E');
    expect(state.usedKeyIndices[1]).toBe(4);

    // Remove slot 0 -> frees keyIndex 1 while keyIndex 4 stays used
    state = removeLetterState(state, 0);
    expect(state.filledSlots[0]).toBeNull();
    expect(state.usedKeyIndices[0]).toBeNull();
    expect(state.usedKeyIndices[1]).toBe(4);
  });

  it('reclaims a needed key from a wrong slot when applying a smart hint', () => {
    // Word: CAT, only one 'C' on the keyboard at index 2
    const keys = ['A', 'T', 'C', 'X', 'Y', 'Z', 'M', 'N', 'O', 'P', 'Q', 'R'];
    let state = makeTestState('CAT', keys);

    // User places 'X' (key 3) in slot 0 and 'C' (key 2) in slot 1 (wrong slot for C!)
    state = typeLetterState(state, 'X', 3).state;
    state = typeLetterState(state, 'C', 2).state;
    expect(state.filledSlots).toEqual(['X', 'C', null]);
    expect(state.usedKeyIndices).toEqual([3, 2, null]);

    // Trigger smart hint -> should fix slot 0 to 'C' by reclaiming keyIndex 2 from wrong slot 1
    const hintRes = applySmartHintState(state);
    expect(hintRes.applied).toBe(true);
    expect(hintRes.slotIndex).toBe(0);
    expect(hintRes.state.filledSlots).toEqual(['C', null, null]);
    expect(hintRes.state.usedKeyIndices).toEqual([2, null, null]);
    expect(hintRes.state.hintsRemaining).toBe(1);
  });

  it('resolves physical keyboard actions for typing, duplicate overflow removal, and Backspace', () => {
    // Only one 'C' at index 0
    const keys = ['C', 'A', 'T', 'X', 'Y', 'Z', 'M', 'N', 'O', 'P', 'Q', 'R'];
    let state = makeTestState('CAT', keys);

    // Pressing 'c' types keyIndex 0
    const act1 = resolvePhysicalKeyAction(state, 'c');
    expect(act1).toEqual({ type: 'type', char: 'C', keyIndex: 0 });
    state = typeLetterState(state, 'C', 0).state;

    // Pressing 'c' again when no unused 'C' key remains removes the last filled 'C' (slot 0)
    const act2 = resolvePhysicalKeyAction(state, 'c');
    expect(act2).toEqual({ type: 'remove', slotIndex: 0 });

    // Type 'A' at slot 1, then press Backspace -> removes rightmost filled slot (slot 1)
    state = typeLetterState(state, 'A', 1).state;
    const actBackspace = resolvePhysicalKeyAction(state, 'Backspace');
    expect(actBackspace).toEqual({ type: 'remove', slotIndex: 1 });
  });

  it('evaluates incomplete, wrong, and correct spellings accurately', () => {
    const keys = ['C', 'A', 'T', 'X', 'Y', 'Z', 'M', 'N', 'O', 'P', 'Q', 'R'];
    let state = makeTestState('CAT', keys);
    expect(evaluateSpelling(state)).toBe('incomplete');

    state = typeLetterState(state, 'C', 0).state;
    state = typeLetterState(state, 'A', 1).state;
    state = typeLetterState(state, 'X', 3).state;
    expect(evaluateSpelling(state)).toBe('wrong');

    state = removeLetterState(state, 2);
    state = typeLetterState(state, 'T', 2).state;
    expect(evaluateSpelling(state)).toBe('correct');
  });

  it('calculates progressive hint counts based on level difficulty with a 1-hint floor', () => {
    // Word length 6 (e.g., 'BANANA')
    // Level 1-4: length - 1 = 5
    expect(calculateInitialHints(6, 1)).toBe(5);
    expect(calculateInitialHints(6, 2)).toBe(5);
    expect(calculateInitialHints(6, 3)).toBe(5);
    expect(calculateInitialHints(6, 4)).toBe(5);

    // Level 5-6: length - 2 = 4
    expect(calculateInitialHints(6, 5)).toBe(4);
    expect(calculateInitialHints(6, 6)).toBe(4);

    // Level 7-8: length - 3 = 3
    expect(calculateInitialHints(6, 7)).toBe(3);
    expect(calculateInitialHints(6, 8)).toBe(3);

    // Level 9-10: length - 4 = 2
    expect(calculateInitialHints(6, 9)).toBe(2);
    expect(calculateInitialHints(6, 10)).toBe(2);

    // Short word (length 3, e.g. 'CAT')
    // Level 1-4: 3 - 1 = 2
    expect(calculateInitialHints(3, 1)).toBe(2);
    // Level 5-6: 3 - 2 = 1
    expect(calculateInitialHints(3, 5)).toBe(1);
    // Level 7-8: 3 - 3 = 0 -> clamped to 1 hint floor
    expect(calculateInitialHints(3, 7)).toBe(1);
    // Level 9-10: 3 - 4 = -1 -> clamped to 1 hint floor
    expect(calculateInitialHints(3, 9)).toBe(1);

    // Edge case: single letter word
    expect(calculateInitialHints(1, 1)).toBe(0);

    // initWordState applies calculateInitialHints for the active level
    const baseState = { ...makeTestState('ELEPHANT', []), filledSlots: [] };
    const lvl1Init = initWordState({ ...baseState, level: 1 });
    expect(lvl1Init.hintsRemaining).toBe(7); // 8 - 1 = 7

    const lvl5Init = initWordState({ ...baseState, level: 5 });
    expect(lvl5Init.hintsRemaining).toBe(6); // 8 - 2 = 6

    const lvl8Init = initWordState({ ...baseState, level: 8 });
    expect(lvl8Init.hintsRemaining).toBe(5); // 8 - 3 = 5

    const lvl10Init = initWordState({ ...baseState, level: 10 });
    expect(lvl10Init.hintsRemaining).toBe(4); // 8 - 4 = 4
  });
});

