import { test, expect } from '@playwright/test';

test.describe('Keyboard Input and HUD Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('physical keyboard typing and backspace removal', async ({ page }) => {
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    // Get an available key from keyboardKeys
    const availableKey = await page.evaluate(() => {
      const raw = localStorage.getItem('t2s_save_state');
      const state = JSON.parse(raw || '{}');
      return state.keyboardKeys?.[0] || 'A';
    });

    // Type a letter via physical keyboard
    await page.keyboard.press(availableKey);
    await page.waitForTimeout(400);

    // Verify filled slot exists
    const filledSlots = page.locator('#word-slots .bg-blue-600');
    await expect(filledSlots).toHaveCount(1);
    await expect(filledSlots.first()).toHaveText(availableKey);

    // Press Backspace
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(400);

    // The filled slots should now be 0
    await expect(page.locator('#word-slots .bg-blue-600')).toHaveCount(0);
    await page.waitForTimeout(600);
  });

  test('HUD sound mute and unmute toggle with localStorage persistence', async ({ page }) => {
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    const soundBtn = page.locator('#btn-toggle-sound');
    await expect(soundBtn).toBeVisible();
    await expect(soundBtn).toHaveAttribute('title', 'Mute Sound');

    // Click to mute
    await soundBtn.click();
    await page.waitForTimeout(400);
    await expect(soundBtn).toHaveAttribute('title', 'Unmute Sound');

    // Verify localStorage persistence with t2s_audio_muted
    const isMutedInStorage = await page.evaluate(() => localStorage.getItem('t2s_audio_muted'));
    expect(isMutedInStorage).toBe('true');

    // Click again to unmute
    await soundBtn.click();
    await page.waitForTimeout(400);
    await expect(soundBtn).toHaveAttribute('title', 'Mute Sound');

    const isUnmutedInStorage = await page.evaluate(() => localStorage.getItem('t2s_audio_muted'));
    expect(isUnmutedInStorage).toBe('false');
  });

  test('HUD keyboard layout toggle between Letter Bank and QWERTY', async ({ page }) => {
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    const layoutToggle = page.locator('#btn-layout-toggle');
    await expect(layoutToggle).toBeVisible();
    await expect(layoutToggle).toContainText('Letter Bank');

    // Switch to QWERTY
    await layoutToggle.click();
    await page.waitForTimeout(500);
    await expect(layoutToggle).toContainText('QWERTY');

    // Verify QWERTY backspace button is present
    const qwertyBackspace = page.locator('#btn-qwerty-backspace');
    await expect(qwertyBackspace).toBeVisible();

    // Click a letter in QWERTY layout
    const qwertyKey = page.locator('#keyboard button.btn-3d').first();
    await qwertyKey.click();
    await page.waitForTimeout(400);

    // Verify 1 filled slot exists
    await expect(page.locator('#word-slots .bg-blue-600')).toHaveCount(1);

    // Click QWERTY backspace
    await qwertyBackspace.click();
    await page.waitForTimeout(400);
    await expect(page.locator('#word-slots .bg-blue-600')).toHaveCount(0);

    // Toggle back to Letter Bank
    await layoutToggle.click();
    await page.waitForTimeout(500);
    await expect(layoutToggle).toContainText('Letter Bank');
    await expect(page.locator('#btn-qwerty-backspace')).not.toBeVisible();
  });

  test('interactive level selector dropdown jumps to arbitrary levels', async ({ page }) => {
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    // Verify initial level is 1
    await expect(page.locator('#hud-level')).toContainText('1');

    // Jump to Level 5
    const levelSelect = page.locator('#hud-level-select');
    await levelSelect.selectOption('5');
    await page.waitForTimeout(600);
    await expect(page.locator('#hud-level')).toContainText('5');

    // Jump to Level 10
    await levelSelect.selectOption('10');
    await page.waitForTimeout(600);
    await expect(page.locator('#hud-level')).toContainText('10');
    await page.waitForTimeout(1000);
  });

  test('clue, word slots, and layout toggle push down without overlapping on small screens', async ({ page }) => {
    const viewports = [
      { name: 'short-desktop', width: 900, height: 550, landscapeSplit: false },
      { name: 'small-mobile', width: 375, height: 550, landscapeSplit: false },
      { name: 'short-tablet', width: 768, height: 520, landscapeSplit: false },
      { name: 'phone-landscape', width: 667, height: 375, landscapeSplit: true },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/high-school/colors');
      await expect(page.locator('#game-screen')).toBeVisible();

      const wordImage = await page.locator('#word-image').boundingBox();
      const sentence = await page.locator('#word-example-sentence').boundingBox();
      const tapHint = await page.getByRole('button', { name: /Tap picture or boxes to hear/i }).boundingBox();
      const wordSlots = await page.locator('#word-slots').boundingBox();
      const layoutToggle = await page.locator('#btn-layout-toggle').boundingBox();
      const keyboard = await page.locator('#keyboard').boundingBox();

      expect(wordImage, `${vp.name}: #word-image missing`).not.toBeNull();
      expect(sentence, `${vp.name}: #word-example-sentence missing`).not.toBeNull();
      expect(tapHint, `${vp.name}: tapHint missing`).not.toBeNull();
      expect(wordSlots, `${vp.name}: #word-slots missing`).not.toBeNull();
      expect(layoutToggle, `${vp.name}: #btn-layout-toggle missing`).not.toBeNull();
      expect(keyboard, `${vp.name}: #keyboard missing`).not.toBeNull();

      // Within the clue section, elements stack vertically without overlap
      expect(sentence!.y, `${vp.name}: sentence overlaps image`).toBeGreaterThanOrEqual(wordImage!.y + wordImage!.height - 1);
      expect(tapHint!.y, `${vp.name}: tapHint overlaps sentence`).toBeGreaterThanOrEqual(sentence!.y + sentence!.height - 1);

      // Within the right/bottom section, elements stack vertically without overlap
      expect(layoutToggle!.y, `${vp.name}: layoutToggle overlaps wordSlots`).toBeGreaterThanOrEqual(wordSlots!.y + wordSlots!.height - 1);
      expect(keyboard!.y, `${vp.name}: keyboard overlaps layoutToggle`).toBeGreaterThanOrEqual(layoutToggle!.y + layoutToggle!.height - 1);

      if (vp.landscapeSplit) {
        // Side-by-side columns: clue section is to the left of wordSlots/layoutToggle
        expect(wordSlots!.x, `${vp.name}: wordSlots overlaps clue column horizontally`).toBeGreaterThanOrEqual(
          Math.max(wordImage!.x + wordImage!.width, sentence!.x + sentence!.width, tapHint!.x + tapHint!.width) - 1
        );
      } else {
        // Stacked vertically: wordSlots is pushed down below tapHint
        expect(wordSlots!.y, `${vp.name}: wordSlots overlaps tapHint`).toBeGreaterThanOrEqual(tapHint!.y + tapHint!.height - 1);
      }
    }
  });
});
