import grade16Data from '../../data/grade16.json';
import othersData from '../../data/others.json';

export const TOTAL_LEVELS = 10;

export type NumericGrade = 1 | 2 | 3 | 4 | 5 | 6;
export type GradeLevel = NumericGrade | 'high_school';

export type HighSchoolCategoryKey =
  | 'colors'
  | 'animals'
  | 'everyday_life'
  | 'nature'
  | 'places'
  | 'movies'
  | 'fruits';

export type HighSchoolCategoryName =
  | 'Colors'
  | 'Animals'
  | 'Everyday Life'
  | 'Nature'
  | 'Places'
  | 'Movies'
  | 'Fruits';

export type GradeCategoryName =
  | 'Grade 1'
  | 'Grade 2'
  | 'Grade 3'
  | 'Grade 4'
  | 'Grade 5'
  | 'Grade 6';

export type CategoryName =
  | GradeCategoryName
  | HighSchoolCategoryName
  | HighSchoolCategoryKey
  | string;

export type DifficultyTier = 'level_1' | 'level_2' | 'level_3' | 'level_4';

export interface WordEntry {
  w: string;
  i: string;
  examples?: string[];
}

export type WordItem = WordEntry;

export interface HighSchoolCategoryMeta {
  key: HighSchoolCategoryKey;
  label: HighSchoolCategoryName;
  emoji: string;
  gradientClass: string;
  shadowClass: string;
  borderClass: string;
}

export const HIGH_SCHOOL_CATEGORIES: HighSchoolCategoryMeta[] = [
  {
    key: 'colors',
    label: 'Colors',
    emoji: '🎨',
    gradientClass: 'from-pink-400 to-rose-600',
    shadowClass: 'shadow-[0_8px_0_#9f1239]',
    borderClass: 'border-pink-200',
  },
  {
    key: 'animals',
    label: 'Animals',
    emoji: '🦁',
    gradientClass: 'from-orange-400 to-red-500',
    shadowClass: 'shadow-[0_8px_0_#991b1b]',
    borderClass: 'border-orange-200',
  },
  {
    key: 'everyday_life',
    label: 'Everyday Life',
    emoji: '🏠',
    gradientClass: 'from-blue-400 to-indigo-600',
    shadowClass: 'shadow-[0_8px_0_#3730a3]',
    borderClass: 'border-blue-200',
  },
  {
    key: 'nature',
    label: 'Nature',
    emoji: '🌿',
    gradientClass: 'from-green-400 to-teal-600',
    shadowClass: 'shadow-[0_8px_0_#115e59]',
    borderClass: 'border-green-200',
  },
  {
    key: 'places',
    label: 'Places',
    emoji: '🗺️',
    gradientClass: 'from-cyan-400 to-blue-600',
    shadowClass: 'shadow-[0_8px_0_#1e40af]',
    borderClass: 'border-cyan-200',
  },
  {
    key: 'movies',
    label: 'Movies',
    emoji: '🎬',
    gradientClass: 'from-purple-400 to-violet-600',
    shadowClass: 'shadow-[0_8px_0_#5b21b6]',
    borderClass: 'border-purple-200',
  },
  {
    key: 'fruits',
    label: 'Fruits',
    emoji: '🍎',
    gradientClass: 'from-amber-400 to-orange-600',
    shadowClass: 'shadow-[0_8px_0_#9a3412]',
    borderClass: 'border-amber-200',
  },
];

function normalizeWordEntries(entries: Array<{ w: string; i: string; examples?: string[] }>): WordEntry[] {
  return entries.map((entry) => ({
    w: entry.w.trim().toUpperCase(),
    i: entry.i,
    ...(entry.examples ? { examples: entry.examples } : {}),
  }));
}

type GradeTierMap = Record<'level_1' | 'level_2' | 'level_3', WordEntry[]>;
type HighSchoolTierMap = Record<'level_1' | 'level_2' | 'level_3' | 'level_4', WordEntry[]>;

export interface WordPoolsStructure {
  grades: Record<`grade_${NumericGrade}`, GradeTierMap>;
  highSchool: Record<HighSchoolCategoryKey, HighSchoolTierMap>;
}

const rawGrades = grade16Data.grades;
const rawOthers = othersData.data;

export const WORD_POOLS: WordPoolsStructure = {
  grades: {
    grade_1: {
      level_1: normalizeWordEntries(rawGrades.grade_1.level_1),
      level_2: normalizeWordEntries(rawGrades.grade_1.level_2),
      level_3: normalizeWordEntries(rawGrades.grade_1.level_3),
    },
    grade_2: {
      level_1: normalizeWordEntries(rawGrades.grade_2.level_1),
      level_2: normalizeWordEntries(rawGrades.grade_2.level_2),
      level_3: normalizeWordEntries(rawGrades.grade_2.level_3),
    },
    grade_3: {
      level_1: normalizeWordEntries(rawGrades.grade_3.level_1),
      level_2: normalizeWordEntries(rawGrades.grade_3.level_2),
      level_3: normalizeWordEntries(rawGrades.grade_3.level_3),
    },
    grade_4: {
      level_1: normalizeWordEntries(rawGrades.grade_4.level_1),
      level_2: normalizeWordEntries(rawGrades.grade_4.level_2),
      level_3: normalizeWordEntries(rawGrades.grade_4.level_3),
    },
    grade_5: {
      level_1: normalizeWordEntries(rawGrades.grade_5.level_1),
      level_2: normalizeWordEntries(rawGrades.grade_5.level_2),
      level_3: normalizeWordEntries(rawGrades.grade_5.level_3),
    },
    grade_6: {
      level_1: normalizeWordEntries(rawGrades.grade_6.level_1),
      level_2: normalizeWordEntries(rawGrades.grade_6.level_2),
      level_3: normalizeWordEntries(rawGrades.grade_6.level_3),
    },
  },
  highSchool: {
    colors: {
      level_1: normalizeWordEntries(rawOthers.colors.level_1),
      level_2: normalizeWordEntries(rawOthers.colors.level_2),
      level_3: normalizeWordEntries(rawOthers.colors.level_3),
      level_4: normalizeWordEntries(rawOthers.colors.level_4),
    },
    animals: {
      level_1: normalizeWordEntries(rawOthers.animals.level_1),
      level_2: normalizeWordEntries(rawOthers.animals.level_2),
      level_3: normalizeWordEntries(rawOthers.animals.level_3),
      level_4: normalizeWordEntries(rawOthers.animals.level_4),
    },
    everyday_life: {
      level_1: normalizeWordEntries(rawOthers.everyday_life.level_1),
      level_2: normalizeWordEntries(rawOthers.everyday_life.level_2),
      level_3: normalizeWordEntries(rawOthers.everyday_life.level_3),
      level_4: normalizeWordEntries(rawOthers.everyday_life.level_4),
    },
    nature: {
      level_1: normalizeWordEntries(rawOthers.nature.level_1),
      level_2: normalizeWordEntries(rawOthers.nature.level_2),
      level_3: normalizeWordEntries(rawOthers.nature.level_3),
      level_4: normalizeWordEntries(rawOthers.nature.level_4),
    },
    places: {
      level_1: normalizeWordEntries(rawOthers.places.level_1),
      level_2: normalizeWordEntries(rawOthers.places.level_2),
      level_3: normalizeWordEntries(rawOthers.places.level_3),
      level_4: normalizeWordEntries(rawOthers.places.level_4),
    },
    movies: {
      level_1: normalizeWordEntries(rawOthers.movies.level_1),
      level_2: normalizeWordEntries(rawOthers.movies.level_2),
      level_3: normalizeWordEntries(rawOthers.movies.level_3),
      level_4: normalizeWordEntries(rawOthers.movies.level_4),
    },
    fruits: {
      level_1: normalizeWordEntries(rawOthers.fruits.level_1),
      level_2: normalizeWordEntries(rawOthers.fruits.level_2),
      level_3: normalizeWordEntries(rawOthers.fruits.level_3),
      level_4: normalizeWordEntries(rawOthers.fruits.level_4),
    },
  },
};

export function normalizeGradeLevel(grade: GradeLevel | number | string | null | undefined): GradeLevel {
  if (grade === 'high_school' || grade === '7' || grade === 7) {
    return 'high_school';
  }
  const num = typeof grade === 'number' ? grade : parseInt(String(grade ?? ''), 10);
  if (num >= 1 && num <= 6) {
    return num as NumericGrade;
  }
  return 2;
}

export function getWordsPerLevel(grade: GradeLevel | number | string): number {
  const normalized = normalizeGradeLevel(grade);
  if (normalized === 'high_school') return 8;
  switch (normalized) {
    case 1:
      return 2;
    case 2:
      return 3;
    case 3:
      return 4;
    case 4:
      return 5;
    case 5:
      return 6;
    case 6:
      return 7;
    default:
      return 3;
  }
}

export function getDifficultyTierForLevel(
  grade: GradeLevel | number | string,
  level: number
): DifficultyTier {
  const normalizedGrade = normalizeGradeLevel(grade);
  const clampedLevel = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(level || 1)));

  if (normalizedGrade === 'high_school') {
    if (clampedLevel <= 2) return 'level_1';
    if (clampedLevel <= 5) return 'level_2';
    if (clampedLevel <= 8) return 'level_3';
    return 'level_4';
  } else {
    if (clampedLevel <= 3) return 'level_1';
    if (clampedLevel <= 7) return 'level_2';
    return 'level_3';
  }
}

export function resolveHighSchoolCategoryKey(category: string): HighSchoolCategoryKey {
  const cleaned = category.trim().toLowerCase().replace(/\s+/g, '_');
  const match = HIGH_SCHOOL_CATEGORIES.find(
    (c) => c.key === cleaned || c.label.toLowerCase() === category.trim().toLowerCase()
  );
  return match ? match.key : 'animals';
}

export function getHighSchoolCategoryLabel(category: string): HighSchoolCategoryName {
  const key = resolveHighSchoolCategoryKey(category);
  const found = HIGH_SCHOOL_CATEGORIES.find((c) => c.key === key);
  return found ? found.label : 'Animals';
}

export function getTierWordPool(
  category: CategoryName,
  grade: GradeLevel | number | string,
  level: number
): WordEntry[] {
  const normalizedGrade = normalizeGradeLevel(grade);
  const tier = getDifficultyTierForLevel(normalizedGrade, level);

  if (normalizedGrade === 'high_school') {
    const catKey = resolveHighSchoolCategoryKey(String(category));
    return WORD_POOLS.highSchool[catKey][tier];
  }

  const gradeKey = `grade_${normalizedGrade}` as const;
  const gradeTier = tier === 'level_4' ? 'level_3' : tier;
  return WORD_POOLS.grades[gradeKey][gradeTier];
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface GenerateLevelWordsResult {
  words: WordEntry[];
  wordPoolQueue: WordEntry[];
}

/**
 * Draws `getWordsPerLevel(grade)` unique words for the given `level` from the
 * active difficulty tier's shuffled queue.
 * - Automatically resets the queue when transitioning into a new difficulty tier.
 * - Replenishes from a newly shuffled copy of the tier pool only when the queue runs low,
 *   preventing any duplicate word within the same level and ensuring every word in the tier
 *   is seen before any word repeats.
 */
export function generateLevelWords(
  category: CategoryName,
  grade: GradeLevel | number | string,
  level: number = 1,
  existingQueue: WordEntry[] = []
): GenerateLevelWordsResult {
  const pool = getTierWordPool(category, grade, level);
  const count = getWordsPerLevel(grade);
  const poolWordSet = new Set(pool.map((item) => item.w));

  // Keep existing queue items only if they belong to the current difficulty tier pool
  let queue = existingQueue.filter((item) => item && poolWordSet.has(item.w));
  if (queue.length === 0) {
    queue = shuffleArray(pool);
  }

  const selected: WordEntry[] = [];
  const selectedWordStrings = new Set<string>();

  while (selected.length < count) {
    if (queue.length === 0) {
      const freshShuffled = shuffleArray(pool);
      const nonDuplicates = freshShuffled.filter((item) => !selectedWordStrings.has(item.w));
      const duplicates = freshShuffled.filter((item) => selectedWordStrings.has(item.w));
      queue = [...nonDuplicates, ...duplicates];
    }

    // Find the first candidate in queue not already in the current level
    const nextIdx = queue.findIndex((item) => !selectedWordStrings.has(item.w));
    if (nextIdx !== -1) {
      const [picked] = queue.splice(nextIdx, 1);
      selected.push(picked);
      selectedWordStrings.add(picked.w);
    } else if (queue.length > 0) {
      // Only reached if count > total unique words in pool
      const picked = queue.shift()!;
      selected.push(picked);
      selectedWordStrings.add(picked.w);
    } else {
      break;
    }
  }

  return {
    words: selected,
    wordPoolQueue: queue,
  };
}

export const generateLevelWordsWithQueue = generateLevelWords;

/**
 * Generates the shuffled on-screen keyboard array containing all uppercase characters
 * of `targetWord` plus random uppercase letters (`A-Z`) up to `Math.max(12, targetWord.length + 5)`.
 */
export function generateKeyboard(targetWord: string): string[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cleanWord = targetWord.trim().toUpperCase();
  const keys = cleanWord.split('');
  const maxKeys = Math.max(12, cleanWord.length + 5);

  while (keys.length < maxKeys) {
    keys.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }

  return shuffleArray(keys);
}

