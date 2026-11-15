import { test, expect } from '@playwright/test';

test.describe('Gameplay Mechanics and Audio/Clue Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('clue interaction, audio buttons, and slot letter removal', async ({ page }) => {
    // Start Grade 1
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    // 1. Clue elements
    const wordImage = page.locator('#word-image');
    await expect(wordImage).toBeVisible();

    const listenButton = page.locator('#listen-button');
    await expect(listenButton).toBeVisible();

    // Click word image and listen button to trigger audio/TTS
    await wordImage.click();
    await page.waitForTimeout(400);
    await listenButton.click();
    await page.waitForTimeout(400);

    // 2. Click an active key in the keyboard
    const activeKey = page.locator('#keyboard button.btn-3d').first();
    const typedLetter = (await activeKey.textContent())?.trim();
    expect(typedLetter).toBeTruthy();

    await activeKey.click();
    await page.waitForTimeout(400);

    // Verify slot now contains this letter
    const filledSlot = page.locator('#word-slots .bg-blue-600', { hasText: typedLetter! });
    await expect(filledSlot).toBeVisible();

    // 3. Click the filled slot to remove the letter
    await filledSlot.click();
    await page.waitForTimeout(400);

    // Verify the slot is cleared
    await expect(filledSlot).not.toBeVisible();
  });

  test('smart hint button fills correct letter and decrements hint count', async ({ page }) => {
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    // Read initial hint count
    const hintButton = page.locator('#hint-button');
    const initialHintText = await hintButton.textContent();
    const initialHints = parseInt(initialHintText?.match(/\d+/)?.[0] ?? '0', 10);
    expect(initialHints).toBeGreaterThan(0);

    // Read target word from state
    const targetWord = await page.evaluate(() => {
      const raw = localStorage.getItem('t2s_save_state');
      if (!raw) return null;
      const state = JSON.parse(raw);
      return state.currentLevelWords?.[state.wordIndex]?.w ?? null;
    });
    expect(targetWord).toBeTruthy();
    const firstChar = targetWord![0];

    // Click Hint button
    await hintButton.click();
    await page.waitForTimeout(600);

    // Slot 0 should now be filled with firstChar
    const firstSlot = page.locator('#word-slots .bg-blue-600').first();
    await expect(firstSlot).toHaveText(firstChar);

    // Hint count should be decremented by 1
    const newHintText = await hintButton.textContent();
    const newHints = parseInt(newHintText?.match(/\d+/)?.[0] ?? '0', 10);
    expect(newHints).toBe(initialHints - 1);
  });

  test('error shake and red border when spelling wrong word', async ({ page }) => {
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    const { targetWord, keyboardKeys } = await page.evaluate(() => {
      const raw = localStorage.getItem('t2s_save_state');
      const state = JSON.parse(raw || '{}');
      return {
        targetWord: state.currentLevelWords?.[state.wordIndex]?.w || '',
        keyboardKeys: state.keyboardKeys || [],
      };
    });

    const wordLen = targetWord.length;

    // Pick distinct keys from keyboardKeys that do NOT equal targetWord
    const availableKeys = [...keyboardKeys];
    for (let slot = 0; slot < wordLen; slot++) {
      const keyIndex = availableKeys.findIndex(
        (k) => k !== null && (slot === 0 ? k !== targetWord[0] : true)
      );
      const keyToUse = keyIndex !== -1 ? availableKeys[keyIndex] : availableKeys.find(Boolean);
      availableKeys[keyIndex] = null;

      const keyBtn = page
        .locator('#keyboard button.btn-3d', { hasText: new RegExp(`^${keyToUse}$`) })
        .first();
      await keyBtn.click();
      await page.waitForTimeout(200);
    }

    // Allow evaluation time (100ms in App.tsx)
    await page.waitForTimeout(600);

    // Verify error state (either shake, red border or state showErrors)
    const hasError = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('t2s_save_state') || '{}');
      const slots = document.querySelector('#word-slots');
      const hasShake = slots?.classList.contains('animate-shake');
      const hasRedBorder = !!document.querySelector('#word-slots .border-red-500');
      return hasShake || hasRedBorder || state.showErrors === true;
    });

    expect(hasError).toBe(true);
    await page.waitForTimeout(1000);
  });

  test('correct word spelling updates score and transitions to next word', async ({ page }) => {
    await page.locator('#btn-pref-1').click();
    await expect(page.locator('#game-screen')).toBeVisible();

    // Check initial word indicator and score
    await expect(page.locator('#hud-word')).toContainText('1/2');
    await expect(page.locator('#hud-score')).toHaveText('0');

    // Get target word
    const targetWord = await page.evaluate(() => {
      const raw = localStorage.getItem('t2s_save_state');
      const state = JSON.parse(raw || '{}');
      return state.currentLevelWords?.[state.wordIndex]?.w || '';
    });

    // Type the correct word using physical keyboard
    for (const char of targetWord) {
      await page.keyboard.press(char);
      await page.waitForTimeout(300);
    }

    // Wait for word success evaluation and transition (1-second transition)
    await page.waitForTimeout(1800);

    // Score should increase
    const scoreText = await page.locator('#hud-score').textContent();
    const score = parseInt(scoreText || '0', 10);
    expect(score).toBeGreaterThan(0);

    // HUD word indicator should now show word 2/2
    await expect(page.locator('#hud-word')).toContainText('2/2');
    await page.waitForTimeout(1000);
  });
});
