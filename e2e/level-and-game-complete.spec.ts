import { test, expect } from '@playwright/test';

test.describe('Level and Game Complete Overlays', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  async function solveCurrentWord(page: any) {
    const targetWord = await page.evaluate(() => {
      const raw = localStorage.getItem('t2s_save_state');
      const state = JSON.parse(raw || '{}');
      return state.currentLevelWords?.[state.wordIndex]?.w || '';
    });

    for (const char of targetWord) {
      await page.keyboard.press(char);
      await page.waitForTimeout(150);
    }
  }

  test('completing all words in level displays Level Complete overlay and countdown timer', async ({ page }) => {
    // Start Grade 1 (2 words per level)
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    // Solve Word 1
    await solveCurrentWord(page);
    // Wait for word transition
    await page.waitForTimeout(1600);

    // Solve Word 2 (final word of Level 1)
    await solveCurrentWord(page);
    await page.waitForTimeout(1600);

    // Verify Level Complete overlay is displayed
    const overlay = page.locator('#level-overlay');
    await expect(overlay).toBeVisible();

    const title = page.locator('#overlay-title');
    await expect(title).toHaveText('Level Complete!');

    const timer = page.locator('#overlay-timer');
    await expect(timer).toBeVisible();

    // Wait a couple seconds to observe countdown ring
    await page.waitForTimeout(3000);
  });

  test('completing Level 10 displays Game Complete Congratulations overlay with final score', async ({ page }) => {
    // Start Grade 1
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    // Jump to Level 10
    const levelSelect = page.locator('#hud-level-select');
    await levelSelect.selectOption('10');
    await page.waitForTimeout(600);
    await expect(page.locator('#hud-level')).toContainText('10');

    // Solve Word 1 of Level 10
    await solveCurrentWord(page);
    await page.waitForTimeout(1600);

    // Solve Word 2 of Level 10
    await solveCurrentWord(page);
    await page.waitForTimeout(1600);

    // Game Complete overlay should be displayed
    const overlay = page.locator('#level-overlay');
    await expect(overlay).toBeVisible();

    const title = page.locator('#overlay-title');
    await expect(title).toContainText('Congratulations!');

    const subtitle = page.locator('#overlay-subtitle');
    await expect(subtitle).toContainText('Final Score:');

    await page.waitForTimeout(3000);
  });
});
