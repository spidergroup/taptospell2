import { beforeEach, describe, expect, it } from 'vitest';
import {
  PREF_GRADE_KEY,
  SAVE_STATE_KEY,
  clearSaveState,
  createInitialGameState,
  loadGradePref,
  loadKeyboardLayoutPref,
  loadSavedGame,
  saveGameState,
  saveGradePref,
  saveKeyboardLayoutPref,
} from './storage';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

describe('storage.ts — LocalStorage Persistence & Recovery', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  it('persists and loads grade preferences for Grades 1–6 and High School', () => {
    expect(loadGradePref()).toBe(2);

    saveGradePref(5);
    expect(loadGradePref()).toBe(5);

    saveGradePref('high_school');
    expect(loadGradePref()).toBe('high_school');
  });

  it('persists and loads keyboard layout preferences (bank vs qwerty)', () => {
    expect(loadKeyboardLayoutPref()).toBe('bank');

    saveKeyboardLayoutPref('qwerty');
    expect(loadKeyboardLayoutPref()).toBe('qwerty');

    saveKeyboardLayoutPref('bank');
    expect(loadKeyboardLayoutPref()).toBe('bank');
  });

  it('saves and restores active game state and reconstructs missing usedKeyIndices', () => {
    const legacySave = {
      ...createInitialGameState(3),
      isActive: true,
      category: 'Grade 3',
      grade: 3,
      level: 4,
      score: 60,
      wordIndex: 0,
      currentLevelWords: [{ w: 'APPLE', i: '🍎' }],
      keyboardKeys: ['P', 'A', 'L', 'P', 'E', 'Z', 'Q', 'R', 'S', 'T', 'U', 'V'],
      filledSlots: ['A', 'P', 'P', null, null],
      usedKeyIndices: undefined,
      hintsRemaining: undefined,
    };

    globalThis.localStorage.setItem(SAVE_STATE_KEY, JSON.stringify(legacySave));

    const loaded = loadSavedGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.grade).toBe(3);
    expect(loaded!.level).toBe(4);
    expect(loaded!.hintsRemaining).toBe(4); // targetWord.length - 1 = 4
    expect(loaded!.usedKeyIndices).toEqual([1, 0, 3, null, null]);
  });

  it('gracefully clears corrupted JSON in t2s_save_state without crashing', () => {
    globalThis.localStorage.setItem(SAVE_STATE_KEY, '{corrupted-json');
    const loaded = loadSavedGame();
    expect(loaded).toBeNull();
    expect(globalThis.localStorage.getItem(SAVE_STATE_KEY)).toBeNull();

    saveGameState({ ...createInitialGameState(1), isActive: true });
    expect(loadSavedGame()).not.toBeNull();
    clearSaveState();
    expect(loadSavedGame()).toBeNull();
  });
});
