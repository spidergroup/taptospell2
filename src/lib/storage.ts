import {
  type CategoryName,
  type GradeLevel,
  type WordEntry,
  getWordsPerLevel,
  normalizeGradeLevel,
} from '../data/words';

export const PREF_GRADE_KEY = 't2s_pref_grade';
export const SAVE_STATE_KEY = 't2s_save_state';

export interface GameState {
  isActive: boolean;
  category: CategoryName;
  grade: GradeLevel;
  level: number;
  score: number;
  wordIndex: number;
  currentLevelWords: WordEntry[];
  wordPoolQueue: WordEntry[];
  keyboardKeys: string[];
  filledSlots: Array<string | null>;
  usedKeyIndices: Array<number | null>;
  hintsRemaining: number;
  showErrors: boolean;
}

export function createInitialGameState(grade: GradeLevel = 2): GameState {
  return {
    isActive: false,
    category: '',
    grade,
    level: 1,
    score: 0,
    wordIndex: 0,
    currentLevelWords: [],
    wordPoolQueue: [],
    keyboardKeys: [],
    filledSlots: [],
    usedKeyIndices: [],
    hintsRemaining: 0,
    showErrors: false,
  };
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

export function loadGradePref(): GradeLevel {
  const storage = getStorage();
  if (!storage) return 2;
  const saved = storage.getItem(PREF_GRADE_KEY);
  if (!saved) return 2;
  return normalizeGradeLevel(saved);
}

export function saveGradePref(grade: GradeLevel): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(PREF_GRADE_KEY, String(grade));
}

export function reconstructUsedKeyIndices(
  filledSlots: Array<string | null>,
  keyboardKeys: string[]
): Array<number | null> {
  const usedKeyIndices: Array<number | null> = new Array(filledSlots.length).fill(null);

  filledSlots.forEach((char, slotIdx) => {
    if (char) {
      const keyIdx = keyboardKeys.findIndex(
        (k, idx) => k === char && !usedKeyIndices.includes(idx)
      );
      if (keyIdx !== -1) {
        usedKeyIndices[slotIdx] = keyIdx;
      }
    }
  });

  return usedKeyIndices;
}

export function clearSaveState(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(SAVE_STATE_KEY);
}

export function saveGameState(state: GameState): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(SAVE_STATE_KEY, JSON.stringify(state));
}

export function loadSavedGame(): GameState | null {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(SAVE_STATE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.isActive) {
      return null;
    }

    const grade = normalizeGradeLevel(parsed.grade);
    const currentLevelWords: WordEntry[] = Array.isArray(parsed.currentLevelWords)
      ? parsed.currentLevelWords
      : [];
    const wordIndex = typeof parsed.wordIndex === 'number' ? parsed.wordIndex : 0;
    const currentWordObj = currentLevelWords[wordIndex];
    const targetLen = currentWordObj?.w?.length ?? 0;

    let hintsRemaining = parsed.hintsRemaining;
    if (typeof hintsRemaining !== 'number') {
      if (targetLen > 0) {
        hintsRemaining = Math.max(0, targetLen - 1);
      } else {
        const wordsCount = getWordsPerLevel(grade);
        hintsRemaining = Math.max(0, wordsCount - 1);
      }
    }

    const keyboardKeys: string[] = Array.isArray(parsed.keyboardKeys) ? parsed.keyboardKeys : [];
    const filledSlots: Array<string | null> = Array.isArray(parsed.filledSlots)
      ? parsed.filledSlots
      : [];

    let usedKeyIndices: Array<number | null> = Array.isArray(parsed.usedKeyIndices)
      ? parsed.usedKeyIndices
      : [];

    if (filledSlots.length > 0 && usedKeyIndices.length !== filledSlots.length) {
      usedKeyIndices = reconstructUsedKeyIndices(filledSlots, keyboardKeys);
    }

    return {
      isActive: true,
      category: typeof parsed.category === 'string' ? parsed.category : '',
      grade,
      level: typeof parsed.level === 'number' ? parsed.level : 1,
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      wordIndex,
      currentLevelWords,
      wordPoolQueue: Array.isArray(parsed.wordPoolQueue) ? parsed.wordPoolQueue : [],
      keyboardKeys,
      filledSlots,
      usedKeyIndices,
      hintsRemaining,
      showErrors: Boolean(parsed.showErrors),
    };
  } catch (err) {
    console.error('Corrupted save state', err);
    clearSaveState();
    return null;
  }
}

