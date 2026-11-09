import { describe, expect, it } from 'vitest';
import {
  HIGH_SCHOOL_CATEGORIES,
  TOTAL_LEVELS,
  WORD_POOLS,
  type WordEntry,
  generateKeyboard,
  generateLevelWords,
  getDifficultyTierForLevel,
  getTierWordPool,
  getWordsPerLevel,
} from './words';

describe('words.ts — WORD_POOLS, Progressive Difficulty & Queue Cycling', () => {
  it('loads all 6 elementary grades from data/grade16.json with 3 difficulty tiers each', () => {
    expect(TOTAL_LEVELS).toBe(10);

    const expectedCounts = {
      grade_1: { level_1: 110, level_2: 130, level_3: 75 },
      grade_2: { level_1: 74, level_2: 76, level_3: 68 },
      grade_3: { level_1: 79, level_2: 80, level_3: 69 },
      grade_4: { level_1: 97, level_2: 134, level_3: 126 },
      grade_5: { level_1: 97, level_2: 158, level_3: 160 },
      grade_6: { level_1: 98, level_2: 153, level_3: 180 },
    } as const;

    for (const [gradeKey, tiers] of Object.entries(expectedCounts)) {
      const pool = WORD_POOLS.grades[gradeKey as keyof typeof WORD_POOLS.grades];
      expect(pool.level_1.length).toBe(tiers.level_1);
      expect(pool.level_2.length).toBe(tiers.level_2);
      expect(pool.level_3.length).toBe(tiers.level_3);

      for (const entry of [...pool.level_1, ...pool.level_2, ...pool.level_3]) {
        expect(entry.w).toBe(entry.w.toUpperCase());
        expect(entry.i.length).toBeGreaterThan(0);
      }
    }
  });

  it('loads all 7 High School categories from data/others.json with 4 difficulty tiers each', () => {
    expect(HIGH_SCHOOL_CATEGORIES.map((c) => c.key)).toEqual([
      'colors',
      'animals',
      'everyday_life',
      'nature',
      'places',
      'movies',
      'fruits',
    ]);

    const expectedCounts = {
      colors: { level_1: 16, level_2: 29, level_3: 31, level_4: 31 },
      animals: { level_1: 33, level_2: 53, level_3: 89, level_4: 84 },
      everyday_life: { level_1: 72, level_2: 98, level_3: 98, level_4: 82 },
      nature: { level_1: 41, level_2: 79, level_3: 93, level_4: 90 },
      places: { level_1: 38, level_2: 76, level_3: 103, level_4: 103 },
      movies: { level_1: 39, level_2: 73, level_3: 80, level_4: 58 },
      fruits: { level_1: 20, level_2: 46, level_3: 59, level_4: 106 },
    } as const;

    for (const [catKey, tiers] of Object.entries(expectedCounts)) {
      const pool = WORD_POOLS.highSchool[catKey as keyof typeof WORD_POOLS.highSchool];
      expect(pool.level_1.length).toBe(tiers.level_1);
      expect(pool.level_2.length).toBe(tiers.level_2);
      expect(pool.level_3.length).toBe(tiers.level_3);
      expect(pool.level_4.length).toBe(tiers.level_4);
    }
  });

  it('maps grade levels to words per level (2 through 8)', () => {
    expect(getWordsPerLevel(1)).toBe(2);
    expect(getWordsPerLevel(2)).toBe(3);
    expect(getWordsPerLevel(3)).toBe(4);
    expect(getWordsPerLevel(4)).toBe(5);
    expect(getWordsPerLevel(5)).toBe(6);
    expect(getWordsPerLevel(6)).toBe(7);
    expect(getWordsPerLevel('high_school')).toBe(8);
    expect(getWordsPerLevel(7)).toBe(8);
    expect(getWordsPerLevel(99)).toBe(3);
  });

  it('maps game levels 1–10 to progressive difficulty tiers for Grades 1–6 and High School', () => {
    // Grades 1–6: Levels 1–3 -> level_1, 4–7 -> level_2, 8–10 -> level_3
    expect([1, 2, 3].map((lvl) => getDifficultyTierForLevel(3, lvl))).toEqual([
      'level_1',
      'level_1',
      'level_1',
    ]);
    expect([4, 5, 6, 7].map((lvl) => getDifficultyTierForLevel(3, lvl))).toEqual([
      'level_2',
      'level_2',
      'level_2',
      'level_2',
    ]);
    expect([8, 9, 10].map((lvl) => getDifficultyTierForLevel(3, lvl))).toEqual([
      'level_3',
      'level_3',
      'level_3',
    ]);

    // High School: Levels 1–2 -> level_1, 3–5 -> level_2, 6–8 -> level_3, 9–10 -> level_4
    expect([1, 2].map((lvl) => getDifficultyTierForLevel('high_school', lvl))).toEqual([
      'level_1',
      'level_1',
    ]);
    expect([3, 4, 5].map((lvl) => getDifficultyTierForLevel('high_school', lvl))).toEqual([
      'level_2',
      'level_2',
      'level_2',
    ]);
    expect([6, 7, 8].map((lvl) => getDifficultyTierForLevel('high_school', lvl))).toEqual([
      'level_3',
      'level_3',
      'level_3',
    ]);
    expect([9, 10].map((lvl) => getDifficultyTierForLevel('high_school', lvl))).toEqual([
      'level_4',
      'level_4',
    ]);
  });

  it('cycles through each difficulty tier across 10 levels without duplicate words in any level or premature repeats', () => {
    // Test across Grade 4 (5 words/level) and High School Colors (8 words/level, where level_1 has exactly 16 words)
    let queue: WordEntry[] = [];
    const seenByTier: Record<string, Set<string>> = {
      level_1: new Set(),
      level_2: new Set(),
      level_3: new Set(),
      level_4: new Set(),
    };

    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      const tier = getDifficultyTierForLevel('high_school', level);
      const tierPool = getTierWordPool('Colors', 'high_school', level);
      const tierPoolSet = new Set(tierPool.map((w) => w.w));

      const result = generateLevelWords('Colors', 'high_school', level, queue);
      queue = result.wordPoolQueue;

      expect(result.words.length).toBe(8);
      // No duplicate words within the same level
      const levelWordsSet = new Set(result.words.map((w) => w.w));
      expect(levelWordsSet.size).toBe(8);

      for (const item of result.words) {
        // Every word belongs to the expected tier for this level
        expect(tierPoolSet.has(item.w)).toBe(true);
        // Since Colors has >= 16 words in level_1 (Levels 1-2 = 16 words) and >= 24 words in level_2/3, no word repeats
        expect(seenByTier[tier].has(item.w)).toBe(false);
        seenByTier[tier].add(item.w);
      }
    }
  });

  it('generates keyboard with all target letters plus distractors up to Math.max(12, len + 5)', () => {
    const shortKeys = generateKeyboard('CAT');
    expect(shortKeys.length).toBe(12);

    const countMap = (arr: string[]) => {
      const map: Record<string, number> = {};
      for (const ch of arr) map[ch] = (map[ch] || 0) + 1;
      return map;
    };

    const shortCounts = countMap(shortKeys);
    expect(shortCounts['C']).toBeGreaterThanOrEqual(1);
    expect(shortCounts['A']).toBeGreaterThanOrEqual(1);
    expect(shortCounts['T']).toBeGreaterThanOrEqual(1);

    const longWord = 'STRAWBERRY'; // length 10 -> Math.max(12, 15) = 15
    const longKeys = generateKeyboard(longWord);
    expect(longKeys.length).toBe(15);
    const longCounts = countMap(longKeys);
    expect(longCounts['R']).toBeGreaterThanOrEqual(3);
  });
});

