import { test, expect } from '@playwright/test';

test.describe('Home Screen and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('displays TapToSpell title, grade selection buttons, and video tutorial', async ({ page }) => {
    const heading = page.locator('h1', { hasText: 'TapToSpell!' });
    await expect(heading).toBeVisible();

    for (let grade = 1; grade <= 6; grade++) {
      const btn = page.locator(`#btn-pref-${grade}`);
      await expect(btn).toBeVisible();
    }

    const hsBtn = page.locator('#btn-pref-high_school');
    await expect(hsBtn).toBeVisible();

    const videoSection = page.locator('#how-to-play-video');
    await expect(videoSection).toBeVisible();

    await page.waitForTimeout(1000);
  });

  test('High School category toggle reveals all 7 topic categories and launches game', async ({ page }) => {
    const hsBtn = page.locator('#btn-pref-high_school');
    await hsBtn.click();
    await page.waitForTimeout(600);

    const categories = [
      'colors',
      'animals',
      'everyday_life',
      'nature',
      'places',
      'movies',
      'fruits',
    ];

    for (const cat of categories) {
      const catBtn = page.locator(`#btn-cat-${cat}`);
      await expect(catBtn).toBeVisible();
    }

    const animalsBtn = page.locator('#btn-cat-animals');
    await animalsBtn.click();

    await expect(page.locator('#game-screen')).toBeVisible();
    await expect(page.locator('#word-image')).toBeVisible();
    await expect(page.locator('#word-slots')).toBeVisible();

    await page.waitForTimeout(1000);
  });

  test('Exit confirmation modal and Continue Game banner workflow', async ({ page }) => {
    // Start Grade 1 game
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    // Click an on-screen key so game progress exists
    const firstKey = page.locator('#keyboard button.btn-3d').first();
    await firstKey.click();
    await page.waitForTimeout(500);

    // Click Exit button
    await page.locator('#btn-exit-home').click();

    // Confirmation dialog should appear
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#leave-game-title')).toHaveText('Leave game?');

    // Test "Keep Playing" first
    await page.getByRole('button', { name: 'Keep Playing' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('#game-screen')).toBeVisible();

    // Now click Exit again and choose "Leave"
    await page.locator('#btn-exit-home').click();
    await page.getByRole('button', { name: 'Leave' }).click();

    // Returns to Home Screen
    await expect(page.locator('#home-screen')).toBeVisible();

    // Continue Banner should be visible with saved game details
    const continueBanner = page.locator('#continue-banner');
    await expect(continueBanner).toBeVisible();
    await expect(page.locator('#continue-details')).toContainText('Grade 1 • Level 1');

    // Click Continue
    await continueBanner.getByRole('button', { name: 'Continue' }).click();

    // Should return to game screen seamlessly
    await expect(page.locator('#game-screen')).toBeVisible();
    await page.waitForTimeout(1000);
  });
});
