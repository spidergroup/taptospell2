## Relevant Files

- `package.json` - Local npm dependencies (`tailwindcss`, `@tailwindcss/cli`, `canvas-confetti`, `@types/canvas-confetti`, `@fontsource/nunito`) and scripts for building client JS (`public/app.js`) and CSS/font assets (`public/styles.css`, `public/fonts/`).
- `.gitignore` - Ignore generated build artifacts (`public/app.js`, `public/styles.css`, `public/fonts/`).
- `src/styles.css` - Local Tailwind CSS configuration, `@fontsource/nunito` font-face rules, `.btn-3d` active state styles, `.word-box-text` clamp sizing, scrollbar hiding, and custom keyframe animations (`animate-pulse-slow`, `animate-bounce-slow`, `animate-shake`).
- `src/worker.ts` - Cloudflare Worker SSR entry serving the HTML shell with local `/styles.css` and `/app.js` and zero external CDN links.
- `data/grade16.json` - Elementary vocabulary and spelling curriculum database for Grades 1–6 (`grades.grade_1` through `grades.grade_6`), each structured into 3 progressive difficulty tiers (`level_1`, `level_2`, `level_3`) with `{ w, i, examples }`.
- `data/others.json` - High School level vocabulary database (`data.<category>`) across 7 topic categories (`colors`, `animals`, `everyday_life`, `nature`, `places`, `movies`, `fruits`), each structured into 4 progressive difficulty tiers (`level_1`, `level_2`, `level_3`, `level_4`) with `{ w, i, examples }`.
- `src/data/words.ts` - Imports `data/grade16.json` and `data/others.json` to expose `WORD_POOLS`, `TOTAL_LEVELS = 10`, `getWordsPerLevel(grade)` (`2`–`8` words/level across Grades 1–6 and High School), progressive difficulty tier resolution (`getDifficultyTierForLevel`), shuffled non-repeating queue cycling (`generateLevelWords`), and `generateKeyboard(targetWord)`.
- `src/data/words.test.ts` - Unit tests verifying `grade16.json` and `others.json` word pools, grade word counts (`2`–`8`), progressive difficulty tier transitions (`level_1` → `level_3` for Grades 1–6; `level_1` → `level_4` for High School), non-repeating shuffled queue cycling across 10 levels, and keyboard generation (`Math.max(12, targetWord.length + 5)`).
- `src/lib/storage.ts` - `GameState` TypeScript interface and `localStorage` persistence helpers (`loadGradePref`, `saveGradePref`, `loadSavedGame`, `saveGameState`, `clearSaveState`) supporting Grades 1–6 (`1`–`6`) and High School (`'high_school'` / `7`), with legacy/corrupted JSON recovery and `usedKeyIndices` reconstruction.
- `src/lib/storage.test.ts` - Unit tests for `localStorage` grade preferences (`1`–`6` and High School), active game state persistence, corrupted JSON fallback, and `usedKeyIndices` reconstruction.
- `src/lib/audio.ts` - Web Audio API synthesizer (`playTone`, grade select, start game, continue, exit, type letter, remove letter, hint chime, 3-note C5–E5–G5 win fanfare, 200Hz sawtooth error buzz), custom audio playback (`playWordAudio`, `stopWordAudio`), and Web Speech API (`speakWord`) with `rate = 0.85`, `pitch = 1.2`, and Google English voice selection.
- `src/lib/audio.test.ts` - Unit tests for Web Audio API tone synthesis, custom audio loading, and Web Speech API utterance configuration.
- `public/audio/words/` - Directory for custom word audio recordings (`<word>.mp3`) with fallback to TTS, plus `README.md` documentation.
- `src/lib/confetti.ts` - Local `canvas-confetti` helpers for the 1-second word completion burst (`250ms` interval, `zIndex: 9999`), 5-second dual-edge level/game complete cannons (`angle: 60` at `x: 0` and `angle: 120` at `x: 1`), and `resetConfetti()` cleanup.
- `src/lib/gameplay.ts` - Pure state functions for `typeLetter` (with `usedKeyIndices` tracking), `removeLetter`, `useHint` (smart first-wrong/empty slot detection + reclaiming needed keys from other wrong slots), `handlePhysicalKeyAction`, and `evaluateSpelling`.
- `src/lib/gameplay.test.ts` - Unit tests for duplicate letter key tracking (`usedKeyIndices`), smart hints with key reclamation, physical keyboard input rules, progressive initial hints calculation, and spelling win/error evaluation.
- `src/lib/seo.ts` - SEO metadata generation (title, description, canonical, Open Graph, Twitter cards, JSON-LD Schema.org structured data, sitemap.xml, robots.txt).
- `src/lib/seo.test.ts` - Unit tests for SEO meta tags, Open Graph, JSON-LD, sitemap, and robots.txt.
- `src/components/Icons.tsx` - Local inline SVG icon components (`PlayIcon`, `HouseIcon`, `VolumeHighIcon`, `VolumeMuteIcon`, `KeyboardIcon`, `LightbulbIcon`, `ChevronDownIcon`) replacing external FontAwesome CDN icons.
- `src/components/HomeScreen.tsx` - Home Screen UI with gradient `"TapToSpell!"` heading, conditional `"Game in Progress!"` Continue Banner, Grade Level Selector (**Grades 1–6** which immediately launch a game for that grade + **High School** which reveals the category grid), and the 7 High School Category Selection cards (**Colors**, **Animals**, **Everyday Life**, **Nature**, **Places**, **Movies**, **Fruits**).
- `src/components/GameScreen.tsx` - Full-viewport locked Game Screen (`h-[100dvh] w-screen overflow-hidden`) with Top HUD (interactive Level selector 1–10 `LEVEL <level> ▾`, `WORD`, `SCORE`, sound toggle, layout toggle, red Home button), Middle Play Area (pulsing clickable emoji and interactive Answer Slots with error glow & shake), and Bottom Controls (adaptive On-Screen Keyboard or QWERTY layout, Hint button with badge, and Listen button).
- `src/components/LevelOverlay.tsx` - Full-screen blurred modal (`#level-overlay`) for `"Level Complete!"` (Levels 1–9) and `"Game Complete!"` (Level 10) with the 5-second circular countdown timer badge.
- `src/App.tsx` - Main application state container connecting `HomeScreen`, `GameScreen`, and `LevelOverlay`, managing level jumping, transition locks (`isTransitioning`), countdown/confetti intervals, custom audio / auto-TTS playback, and the window `keydown` listener.

### Notes

- Unit tests should be placed alongside the code files they are testing (e.g., `src/data/words.ts` and `src/data/words.test.ts` in the same directory).
- Use `npm test` (or `npx vitest run [optional/path/to/test/file]`) to run tests.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new feature branch (e.g., `git checkout -b feature/taptospell2-game`).
- [x] 1.0 Install local dependencies, configure Tailwind CSS, local Nunito font, and build pipeline (zero external CDNs)
  - [x] 1.1 Install `canvas-confetti`, `@types/canvas-confetti`, `tailwindcss`, `@tailwindcss/cli`, and `@fontsource/nunito` as local npm packages in `package.json`.
  - [x] 1.2 Create `src/styles.css` importing Tailwind CSS and local `Nunito` font weights (`600`, `700`, `800`, `900`), and define custom theme animations (`animate-pulse-slow`, `animate-bounce-slow`, `animate-shake` with `0%, 100%: translateX(0)`, `25%: translateX(-10px)`, `75%: translateX(10px)`), `.btn-3d` tactile button styles, `.word-box-text` (`font-size: clamp(1.2rem, 5vw, 2.5rem)`), `user-select: none`, `touch-action: manipulation`, and hidden scrollbars.
  - [x] 1.3 Update `package.json` build scripts (`build:css`, `build:client`, `build`, `dev`) so that local CSS (`public/styles.css`), local font files, and the client JS bundle (`public/app.js`) are compiled into `public/`, and add generated assets to `.gitignore`.
  - [x] 1.4 Update `src/worker.ts` HTML document shell (`renderHtmlDocument`) to include `<link rel="stylesheet" href="/styles.css" />`, proper mobile viewport meta tags (`width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`), and root body classes (`bg-slate-900 text-white h-[100dvh] w-screen overflow-hidden flex flex-col relative`) with zero external `https://` CDN links.
- [x] 2.0 Implement Word Pools (`data/grade16.json` & `data/others.json`), Progressive Difficulty Queue Cycling, Keyboard Generation, and LocalStorage Persistence
  - [x] 2.1 Create `src/data/words.ts` importing `data/grade16.json` (Grades 1–6 curriculum: `grade_1` through `grade_6`, each with `level_1`–`level_3`) and `data/others.json` (High School level categories: `colors`, `animals`, `everyday_life`, `nature`, `places`, `movies`, `fruits`, each with `level_1`–`level_4`), defining `TOTAL_LEVELS = 10`, TypeScript types (`CategoryName`, `GradeLevel`, `DifficultyTier`, `WordEntry`), and structured `WORD_POOLS`.
  - [x] 2.2 Implement `getWordsPerLevel(grade)` scaling by grade: `2` for Grade 1, `3` for Grade 2 (default), `4` for Grade 3, `5` for Grade 4, `6` for Grade 5, `7` for Grade 6, and `8` for High School.
  - [x] 2.3 Implement progressive difficulty tier mapping and shuffled queue cycling (`generateLevelWords(category, grade, level, existingQueue)`):
    - For **Grades 1–6** (`data/grade16.json`): Levels 1–3 draw from `level_1` (Easy), Levels 4–7 draw from `level_2` (Medium), and Levels 8–10 draw from `level_3` (Challenging).
    - For **High School** (`data/others.json`): Levels 1–2 draw from `level_1` (Beginner), Levels 3–5 draw from `level_2` (Intermediate), Levels 6–8 draw from `level_3` (Upper-Intermediate / Advanced), and Levels 9–10 draw from `level_4` (Expert / Specialized).
    - Draw `wordsPerLevel` unique words from the active tier's shuffled queue and replenish from that tier's pool only when the queue runs low or when transitioning to a new difficulty tier—ensuring no duplicate word appears within a level and no word repeats prematurely.
  - [x] 2.4 Implement `generateKeyboard(targetWord)` in `src/data/words.ts` that includes all uppercase letters of `targetWord` plus random uppercase distractor letters (`A–Z`) up to `Math.max(12, targetWord.length + 5)` total keys, shuffled randomly.
  - [x] 2.5 Create `src/lib/storage.ts` defining the `GameState` interface (`isActive`, `category`, `grade`, `level`, `score`, `wordIndex`, `currentLevelWords`, `wordPoolQueue`, `keyboardKeys`, `filledSlots`, `usedKeyIndices`, `hintsRemaining`, `showErrors`) and helper functions for `t2s_pref_grade` (`1`–`6` or `'high_school'`) and `t2s_save_state` (including fallback defaults for missing `hintsRemaining`, automatic reconstruction of `usedKeyIndices` from `filledSlots`, and safe cleanup of corrupted JSON).
- [x] 3.0 Implement Web Audio API Synthesizer, Web Speech API (TTS), and Confetti Celebration Utilities
  - [x] 3.1 Create `src/lib/audio.ts` implementing `playTone(freq, type, duration, vol)` using `window.AudioContext` (or `webkitAudioContext`), resuming suspended contexts automatically and applying an exponential gain ramp down to `0.001`.
  - [x] 3.2 Add dedicated sound helper functions in `src/lib/audio.ts` matching exact specifications: grade change (`400Hz` sine, `0.1s`), start game (`600Hz` triangle, `0.2s`), continue game (`500Hz` square, `0.2s`), exit to home (`300Hz` sawtooth, `0.2s`), type letter (`400 + slotIndex * 50 Hz` sine, `0.1s`), remove letter (`300Hz` triangle, `0.1s`), use hint (`800Hz` sine, `0.15s`), wrong word (`200Hz` sawtooth, `0.3s`, vol `0.2`), and correct word 3-note fanfare (`523.25Hz` at `0ms`, `659.25Hz` at `100ms`, `783.99Hz` at `200ms`, triangle, vol `0.2`).
  - [x] 3.3 Implement `speakWord(word)` in `src/lib/audio.ts` using `window.speechSynthesis` (canceling active speech first, setting `rate = 0.85` and `pitch = 1.2`, preferring an `en-*` voice containing `"Google"` when available, and handling `onvoiceschanged`).
  - [x] 3.4 Create `src/lib/confetti.ts` wrapping local `canvas-confetti` to provide: (a) a 1-second word win confetti burst firing immediately and every `250ms` (`particleCount: 20`, `spread: 360`, `startVelocity: 15`, `gravity: 0.4`, `ticks: 300`, `zIndex: 9999`), (b) continuous 5-second dual-edge level complete cannons firing immediately and every `250ms` (`angle: 60` at `x: 0, y: 0.5` and `angle: 120` at `x: 1, y: 0.5`, `particleCount: 15`, `spread: 55`, `zIndex: 9999`), and (c) `resetConfetti()` that clears active intervals and calls `confetti.reset()`.
- [x] 4.0 Implement Core Gameplay Mechanics (Duplicate-Key Tracking, Smart Hints with Key Reclamation, and Win/Error Logic)
  - [x] 4.1 Create `src/lib/gameplay.ts` and implement `typeLetterState(state, char, keyIndex)` which places `char` into the first `null` slot of `filledSlots`, records `keyIndex` at the corresponding index of `usedKeyIndices`, and returns the updated state and `slotIndex`.
  - [x] 4.2 Implement `removeLetterState(state, slotIndex)` which clears both `filledSlots[slotIndex] = null` and `usedKeyIndices[slotIndex] = null` and resets `showErrors = false`.
  - [x] 4.3 Implement `applySmartHintState(state)` for `useHint()`: locate the first slot `i` where `filledSlots[i] !== targetWord[i]`, clear any wrong letter in slot `i`, find an unused key in `keyboardKeys` matching `targetWord[i]` (or if all matching keys are currently placed in other wrong slots `sIdx !== i`, reclaim `usedKeyIndices[wrongSlotIdx]` and clear `wrongSlotIdx`), place `targetWord[i]` into `filledSlots[i]`, record its key index in `usedKeyIndices[i]`, decrement `hintsRemaining`, and set `showErrors = false`.
  - [x] 4.4 Implement `resolvePhysicalKeyAction(state, key)` to support physical keyboard input: `Backspace`/`Delete` removes the rightmost filled slot; `A–Z` types the first unused matching key if an empty slot exists, or removes the last filled occurrence of that letter (`filledSlots.lastIndexOf(char)`) if no unused key remains or all slots are full.
- [x] 5.0 Build Home Screen, Game Screen, Level/Game Complete Overlay, and Physical Keyboard Support in React
  - [x] 5.1 Create `src/components/Icons.tsx` with clean inline SVG components for `PlayIcon`, `HouseIcon`, `VolumeHighIcon`, and `LightbulbIcon`.
  - [x] 5.2 Create `src/components/HomeScreen.tsx` implementing the scrollable container (`#home-screen`), gradient `"TapToSpell!"` title, conditional `"Game in Progress!"` Continue Banner (`#continue-banner`, `#continue-details`, 3D Continue button), Grade Level Selector (**1st–6th Grade** buttons that immediately launch a game for that grade using `data/grade16.json`, plus a **High School** button that toggles the category section), and the 7 High School 3D Category Cards (**Colors** 🎨, **Animals** 🦁, **Everyday Life** 🏠, **Nature** 🌿, **Places** 🗺️, **Movies** 🎬, **Fruits** 🍎) backed by `data/others.json`.
  - [x] 5.3 Create `src/components/GameScreen.tsx` implementing the 3-section non-scrolling flex layout (`#game-screen`):
    - Top HUD Bar (`#hud-level`, `#hud-word`, `#hud-score`, and red circular Home/Exit button).
    - Middle Play Area with pulsing clickable emoji (`#word-image`) and single-row Answer Box (`#word-slots`) supporting empty dash slots, blue filled slots (`e.stopPropagation()` + `removeLetter`), glowing red mismatched error borders, and `animate-shake`.
    - Bottom Controls with adaptive On-Screen Keyboard (`#keyboard`, `w-8 h-10` when `> 14` keys else `w-10 h-12`, dimmed used keys that remove their corresponding slot when clicked) and Bottom Toolbar (`#hint-button` with lightbulb SVG + count, and cyan `"Listen"` button).
  - [x] 5.4 Create `src/components/LevelOverlay.tsx` (`#level-overlay`) rendering `"Level Complete!"` (Levels 1–9, yellow-to-amber bouncing title, `"Get ready for the next level..."`) or `"Game Complete!"` (Level 10, green-to-emerald pulsing title, `"Final Score: <score>"`) and the circular 5-second countdown timer ring (`#overlay-timer`).
  - [x] 5.5 Update `src/App.tsx` to coordinate screen navigation (`home` vs. `game`), initialize state from `localStorage`, trigger `speakWord()` `300ms` after loading each word, run `checkWin()` `100ms` after filling the last slot, manage the `1s` word transition and `5s` level overlay countdown, clean up confetti/timers on exit or transition end, and attach the `window` `keydown` listener.
- [x] 6.0 Write Unit Tests and Verify Zero-CDN Build & Responsive Gameplay
  - [x] 6.1 Create `src/data/words.test.ts` testing `grade16.json` (Grades 1–6) and `others.json` (High School 7 categories) word loading, grade-to-words-per-level mapping (`2`–`8`), progressive difficulty tier transitions across Levels 1–10 (`level_1` → `level_3` for Grades 1–6; `level_1` → `level_4` for High School), shuffled queue cycling without premature repeats, and keyboard distractor generation.
  - [x] 6.2 Create `src/lib/gameplay.test.ts` and `src/lib/storage.test.ts` testing duplicate key index tracking (`usedKeyIndices`), smart hint key reclamation from wrong slots, physical keyboard action resolution, win/error detection, and `localStorage` persistence/recovery.
  - [x] 6.3 Create `src/lib/audio.test.ts` testing `playTone` oscillator/gain setup and `speakWord` utterance parameters with mocked Web Audio / Speech APIs.
  - [x] 6.4 Run `npm test` and `npm run build`, verify all unit tests pass and zero external CDN requests exist in the rendered HTML/CSS/JS output.
- [x] 7.0 Implement Audio Toggle, Keyboard Layout Modes, and Complete SEO Infrastructure
  - [x] 7.1 Implement sound mute toggle button (`#btn-toggle-sound`) in Top HUD switching between `VolumeHighIcon` and `VolumeMuteIcon`, muting synthesized tones and speech, and persisting state in `localStorage` (`t2s_pref_muted`).
  - [x] 7.2 Implement keyboard layout toggle button (`#btn-toggle-layout`) in Top HUD switching between dynamic letter bank (`bank`) and full QWERTY layout (`qwerty`), and persisting state in `localStorage` (`t2s_pref_layout`).
  - [x] 7.3 Implement SEO and metadata architecture in `src/lib/seo.ts` (title, description, canonical, Open Graph, Twitter cards, Schema.org JSON-LD structured data, `/sitemap.xml`, and `/robots.txt`) and configure `src/worker.ts` to support both `GET` and `HEAD` requests.
  - [x] 7.4 Add unit tests in `src/lib/seo.test.ts` covering meta tags, JSON-LD, sitemap, and robots.txt.
- [x] 8.0 Implement Interactive Level Selector, Progressive Hints Scaling, Custom Audio Support, and Database Emoji Quality Audit
  - [x] 8.1 Upgrade HUD Level badge to an interactive Level Selector (`LEVEL <level> ▾`, removing `/10`) allowing players to select and jump to any level (1–10) at any time with immediate state reset (clearing confetti, timers, active speech).
  - [x] 8.2 Implement progressive hint calculation in `src/lib/storage.ts` via `calculateInitialHints(wordLength, level)`:
    - Levels 1–4: `hints = wordLength - 1`
    - Levels 5–6: `hints = wordLength - 2`
    - Levels 7–8: `hints = wordLength - 3`
    - Levels 9–10: `hints = wordLength - 4`
    - Guaranteed minimum floor of 1 hint remaining for all multi-character words (`wordLength >= 2`), with unit test coverage in `src/lib/gameplay.test.ts`.
  - [x] 8.3 Implement custom word audio support in `src/lib/audio.ts` (`playWordAudio` and `stopWordAudio`) with automatic checking for local audio files (`/audio/words/<word>.mp3` and `WordEntry.audio`) and fallback to Web Speech API `speakWord`, plus documentation in `public/audio/words/README.md`.
  - [x] 8.4 Perform comprehensive database emoji quality audit across `data/grade16.json` (387 icons updated) and `data/others.json` (106 icons updated):
    - Fix corrupted / mojibake characters (`andeliers` -> `💡`, `鑷` -> `✂️`, `亭` -> `🏛️`, `枣` -> `🍒`, flag `🇯🇲` -> `🍈`, `🇻🇦` -> `🏛️`).
    - Fix misleading or mismatched noun associations (e.g. `AN: 🍎` -> `💬`, `ANOTHER: 🍪` -> `💬`, `EACH: 🍎` -> `💬`, `BIG: 🐘` -> `💬`, `DRAGONFLY: 🐉` -> `🪰`, `AARDVARK: 🐜` -> `🐾`, `KIWI: 🥝` -> `🐦`, `DURIAN: 🦔` -> `🍈`).
    - Standardize abstract concepts, prepositions, and adverbs to speech bubble `💬`.
  - [x] 8.5 Verify full compilation (`npm run build`) and complete test suite passes (`npm test`), confirming all 25 unit tests pass with zero errors.
  - [x] 8.6 Resolve mobile/iPad/iOS Safari sound playback issues:
    - Implement `unlockAudio()` and `setupAudioUnlockListeners()` capturing early user interactions (`touchstart`, `touchend`, `pointerdown`, `click`, `keydown`) to resume suspended `AudioContext` with a silent buffer.
    - Set `navigator.audioSession.type = 'playback'` and play an inaudible HTML5 audio element to switch iOS WebKit's audio channel from ambient to playback, preventing iPad Control Center mute / hardware silent switch from silencing game audio.
    - Prime Web Speech API on the initial user interaction with a silent utterance to unlock `speechSynthesis` on iOS Safari.
    - Retain active `SpeechSynthesisUtterance` globally on `window` to prevent WebKit's JavaScriptCore from prematurely garbage collecting utterances during speech.
    - Implement `public/audio/words/manifest.json` generation (`build:audio`) so `playWordAudio` directly and synchronously invokes `speakWord` for words without custom recordings, avoiding async 404 delays that invalidate iOS user activation.
