# Product Requirements Document (PRD): TapToSpell 2 — Kids Spelling & Learning Game

## 1. Introduction / Overview

**TapToSpell 2** (`taptospell2`) is an interactive, educational spelling and vocabulary game designed for early elementary school children (Grades 1–3). Children learn to spell words across three curated categories (**Animals**, **Fry Words**, and **Sight Words**) by looking at an expressive emoji visual cue, listening to the spoken pronunciation of the word, and tapping or typing letters into answer slots.

### Problem Solved
Young learners need an engaging, distraction-free, tactile spelling environment that provides immediate visual and auditory feedback without requiring complex account creation, external audio asset downloads, or page scrolling that causes accidental touch misclicks.

### Goal
Build **TapToSpell 2** as a modular **React 19 + TypeScript** application running on the project's **TanStack + Cloudflare Workers** stack (`src/`), faithfully implementing all visual designs, animations, audio synthesis, speech synthesis, smart hint mechanics, duplicate-key tracking, and state persistence specified in [`PRD/readme.txt`](./readme.txt) and [`PRD/taptospell_kids_game.html`](./taptospell_kids_game.html), using locally installed npm packages with zero external CDN dependencies.

---

## 2. Goals

1. **Zero-Scroll Responsive Gameplay**: Deliver a full-viewport (`100dvh × 100vw`) locked game layout that never scrolls vertically or horizontally on mobile phones, tablets, or desktops in either portrait or landscape orientation.
2. **Self-Contained Local Bundle (Zero External CDNs)**: Package all styling (`tailwindcss`), celebratory particle effects (`canvas-confetti`), icons, and typography (`Nunito`) via local `npm` dependencies and local assets so the app runs offline-capable without relying on third-party script/stylesheet CDNs.
3. **Complete Non-Repeating Category Coverage Across Levels**: Cycle through shuffled category word pools across levels so players experience the full breadth of each category before any word is repeated in a 10-level session.
4. **Tactile & Accessible Multi-Input Controls**: Support both on-screen 3D touch/click buttons and physical keyboard typing (`A–Z`, `Backspace`, `Delete`) with exact per-key instance tracking for words with duplicate letters.
5. **Zero-Asset Audio & Speech Feedback**: Synthesize all sound effects in real time using the browser's native **Web Audio API (`AudioContext`)** and pronounce words clearly using the **Web Speech API (`window.speechSynthesis`)**.
6. **Seamless Session Persistence**: Automatically save grade preferences and in-progress game state to `localStorage` on every user action so children can close or refresh the browser and resume their exact word, slot state, hints, and score at any time.

---

## 3. User Stories

- **US-1 (Grade Selection)**: As a parent or student, I want to select my grade level (1st, 2nd, or 3rd Grade) on the Home Screen so that the number of words per level matches my skill level (`1`, `3`, or `5` words per level) and is remembered for future visits.
- **US-2 (Starting a Category Game)**: As a player, I want to pick from three colorful category cards (**Animals**, **Fry Words**, or **Sight Words**) so I can practice spelling words in a topic I enjoy across a 10-level game.
- **US-3 (Resuming a Saved Game)**: As a player returning to the app, I want to see a **"Game in Progress!"** banner on the Home Screen showing my saved Category, Grade, and Level, with a **"Continue"** button that restores my exact progress.
- **US-4 (Visual & Spoken Word Cues)**: As a young learner, I want to see a large pulsing emoji representing the word and hear the word spoken aloud automatically when the word loads—or whenever I tap the emoji, the empty answer slot area, or the **"Listen"** button.
- **US-5 (Spelling with On-Screen or Physical Keyboard)**: As a player, I want to tap letter keys on screen (or type on a physical keyboard) to fill answer slots left-to-right, and tap a filled slot or a dimmed used key (or press `Backspace`) to remove a letter and return it to the exact key it came from.
- **US-6 (Smart Hints)**: As a player who is stuck on a letter, I want to tap the **Hint** button so the game automatically places the next needed correct letter into the first incorrect or empty slot (even if I accidentally used that letter in a wrong slot earlier).
- **US-7 (Immediate Error & Celebration Feedback)**: As a player, when I fill all slots with a wrong spelling, I want to see the mismatched letters highlighted in glowing red with a shake animation and error buzzer so I know which letters to fix; when I spell the word or complete a level, I want to hear a musical fanfare and see celebratory confetti.

---

## 4. Functional Requirements

### 4.1. Word Databases (`WORD_POOLS`)
1. **FR-1**: The system must include three built-in word categories mapping uppercase target words (`w`) to an emoji (`i`):
   - **Animals (20 words)**:
     `CAT` (🐱), `DOG` (🐶), `COW` (🐮), `PIG` (🐷), `BIRD` (🐦), `BEAR` (🐻), `LION` (🦁), `FISH` (🐟), `FROG` (🐸), `DUCK` (🦆), `HORSE` (🐴), `SHEEP` (🐑), `FOX` (🦊), `WOLF` (🐺), `TIGER` (🐯), `ZEBRA` (🦓), `MOUSE` (🐭), `SNAKE` (🐍), `CRAB` (🦀), `SEAL` (🦭).
   - **Fry Words (16 words)**:
     `THE` (💬), `AND` (💬), `THAT` (💬), `HAVE` (💬), `THEY` (💬), `WITH` (💬), `THIS` (💬), `FROM` (💬), `WORD` (📝), `WHAT` (❓), `SOME` (💬), `TIME` (⏱️), `MORE` (➕), `LOOK` (👀), `MAKE` (🛠️), `THEM` (💬).
   - **Sight Words (12 words)**:
     `SEE` (👀), `PLAY` (⚽), `JUMP` (🏃), `RUN` (💨), `STOP` (🛑), `GO` (🟢), `FAST` (🚀), `SLOW` (🐢), `UP` (⬆️), `DOWN` (⬇️), `HERE` (👇), `HELP` (🤝).

### 4.2. Home Screen (`HomeScreen`)
2. **FR-2**: The Home Screen must display a centered, vertically scrollable container (`max-w-5xl`) with the gradient heading **"TapToSpell!"**.
3. **FR-3 (Continue Game Banner)**:
   - Hidden when no active saved game exists in `localStorage` (`t2s_save_state`).
   - Displayed at the top of the Home Screen when `t2s_save_state` exists and has `isActive === true`.
   - Shows heading `"Game in Progress!"`, subtitle `"<category> • Grade <grade> • Level <level>"`, and a **"Continue"** button with a play icon.
   - Clicking **"Continue"** plays a `500Hz` square tone (`0.2s`), switches to the Game Screen, and restores the exact saved game state (including current word, filled slots, used keys, hints remaining, and score).
4. **FR-4 (Grade Level Selector)**:
   - Displays three selectable grade buttons:
     - **1st Grade**: `1 word / level`
     - **2nd Grade**: `3 words / level` (default when no preference is saved)
     - **3rd Grade**: `5 words / level`
   - Selecting a grade plays a `400Hz` sine tone (`0.1s`), updates the active selection highlight, and persists the grade number (`1`, `2`, or `3`) to `localStorage` under `t2s_pref_grade`.
5. **FR-5 (Category Selection Cards)**:
   - Displays three 3D gradient cards under `"Start a New Game!"`:
     - **Animals** (🦁)
     - **Fry Words** (💬)
     - **Sight Words** (👀)
   - Clicking a category card plays a `600Hz` triangle tone (`0.2s`), initializes a new 10-level game (`TOTAL_LEVELS = 10`, `level = 1`, `score = 0`, `wordIndex = 0`) for that category using the currently selected `userPrefGrade`, saves state to `localStorage`, and switches to the Game Screen.

### 4.3. Word Queue & Level Generation (Shuffle & Cycle Without Early Repeats)
6. **FR-6**: When starting a new game for a category, the system must maintain a shuffled word queue (`wordPoolQueue` or cursor) across levels so that words are drawn sequentially from a shuffled copy of the category's pool.
7. **FR-7**: When generating words for a level (`1`, `3`, or `5` words based on grade):
   - Pull words from the current shuffled category queue.
   - If the queue runs out of remaining words before filling the level's required word count (`count`), reshuffle the category pool to replenish the queue—ensuring no duplicate word is picked within the same level and every word in the category is seen before any word repeats across levels.

### 4.4. Game Screen HUD & Layout (`GameScreen`)
8. **FR-8 (Top HUD Bar)**:
   - Fixed-height top bar (`shrink-0 h-14 md:h-16`) containing:
     - **LEVEL badge**: Displays `<level>/10`.
     - **WORD badge**: Displays `<wordIndex + 1>/<wordsPerLevel>`.
     - **SCORE badge**: Displays current `score` (`+10` points awarded per completed word).
     - **Home / Exit Button**: Red circular 3D button with a house icon. Clicking it plays a `300Hz` sawtooth tone (`0.2s`), cancels any active countdown/confetti intervals, resets active confetti particles, saves the current `gameState` to `localStorage`, and returns to the Home Screen (where the Continue Banner reflects the latest progress).
9. **FR-9 (Middle Play Area)**:
   - **Animated Word Emoji**: Displays the current word's emoji (`currentWordObj.i`) with a slow pulse animation. Clicking/tapping the emoji calls `speakWord()`.
   - **Answer Box / Word Slots**:
     - Renders one square slot per character of `targetWord` in a single non-wrapping horizontal row.
     - **Empty Slot**: Displays a dark translucent box with a bottom dash indicator. Clicking the empty slots container calls `speakWord()`.
     - **Filled Slot**: Displays the uppercase letter inside a bright blue tile. Clicking a filled slot calls `e.stopPropagation()` and `removeLetter(slotIndex)` (does **not** trigger `speakWord()`).
     - **Wrong Spelling Highlight**: When `showErrors === true`, any filled slot whose letter does not match `targetWord[i]` displays a glowing red border (`border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]`), and the `#word-slots` container plays the horizontal `animate-shake` animation for `400ms`.

### 4.5. On-Screen Keyboard & Duplicate Key Tracking
10. **FR-10 (Keyboard Generation)**:
    - For each new word, generate `keyboardKeys` containing all characters of `targetWord` plus random uppercase letters (`A–Z`) such that total keys equal `Math.max(12, targetWord.length + 5)`, shuffled randomly.
    - Apply adaptive key sizing: compact keys (`w-8 h-10 sm:w-10 sm:h-12 text-lg sm:text-xl`) when `keyboardKeys.length > 14`, or standard keys (`w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl`) when `<= 14`.
11. **FR-11 (Exact Duplicate Letter Tracking via `usedKeyIndices`)**:
    - Maintain `usedKeyIndices` as an array parallel to `filledSlots` (length equal to `targetWord.length`, initialized with `null`).
    - When the user clicks an unused keyboard button at `keyIndex`:
      - Find the first empty slot index `firstEmpty = filledSlots.indexOf(null)`.
      - Set `filledSlots[firstEmpty] = char` and `usedKeyIndices[firstEmpty] = keyIndex`.
      - Only that specific button at `keyIndex` is marked as used (`usedKeyIndices.includes(index)`). Other keyboard buttons with the same letter remain unused and active.
    - When the user clicks a dimmed used keyboard button at `keyIndex`:
      - Find `slotIdx = usedKeyIndices.indexOf(keyIndex)` and call `removeLetter(slotIdx)`, restoring that specific key to its unused 3D state.
    - When the user clicks a filled answer slot at `slotIndex`:
      - Clear `filledSlots[slotIndex] = null` and `usedKeyIndices[slotIndex] = null`, restoring the exact keyboard button at that index.

### 4.6. Physical Keyboard Support
12. **FR-12**: Attach a `keydown` listener while the Game Screen is active (and not showing the Level Overlay or in a win transition):
    - Ignore events when `e.ctrlKey`, `e.altKey`, `e.metaKey`, or `e.repeat` is true.
    - **`Backspace` / `Delete`**: Prevent default browser navigation and remove the letter in the rightmost non-empty slot (`filledSlots[i] !== null`).
    - **Letter Keys (`a–z` or `A–Z`)**:
      - Convert key to uppercase `char`.
      - Look for an empty slot (`filledSlots.includes(null)`) and the first unused matching key in `keyboardKeys` (`k === char && !usedKeyIndices.includes(idx)`).
      - If both exist, call `typeLetter(char, keyIndex)`.
      - Otherwise (if no unused key for `char` remains on the keyboard or all slots are full), find the last filled slot containing `char` (`filledSlots.lastIndexOf(char)`) and call `removeLetter(slotIdx)`.

### 4.7. Bottom Toolbar: Smart Hint System & Listen Button
13. **FR-13 (Hint Allocation & Button State)**:
    - Each word starts with `hintsRemaining = Math.max(0, targetWord.length - 1)`.
    - The Hint button displays a lightbulb SVG icon and the numeric `hintsRemaining` count.
    - When `hintsRemaining <= 0`, the button is disabled (`disabled = true`) and styled with reduced opacity and grayscale.
14. **FR-14 (Smart Hint Execution — `useHint()`)**:
    - Ignored if `isTransitioning === true` or `hintsRemaining <= 0`.
    - Find the first slot index `i` (`0 <= i < targetWord.length`) where `filledSlots[i] !== targetWord[i]`:
      1. Clear any wrong letter currently at `filledSlots[i]` and `usedKeyIndices[i]`.
      2. Search `keyboardKeys` for an unused key index matching `neededChar = targetWord[i]`.
      3. **Key Reclamation**: If no unused key is available (`keyIndex === -1`) because all instances of `neededChar` were placed in other wrong slots (`sIdx !== i && filledSlots[sIdx] === neededChar && filledSlots[sIdx] !== targetWord[sIdx]`), reclaim `keyIndex = usedKeyIndices[wrongSlotIdx]` and clear `filledSlots[wrongSlotIdx] = null` and `usedKeyIndices[wrongSlotIdx] = null`.
      4. Set `filledSlots[i] = neededChar` and `usedKeyIndices[i] = keyIndex`.
      5. Decrement `hintsRemaining` by `1`, set `showErrors = false`, play an `800Hz` sine tone (`0.15s`), save state, and trigger `checkWin()` after `100ms`.
15. **FR-15 (Listen Button)**:
    - Clicking the **Listen** button speaks the current target word via `speakWord()`.

### 4.8. Win Validation, Confetti & Level Transitions (`checkWin()`)
16. **FR-16**: `100ms` after the last empty slot is filled (`!filledSlots.includes(null)`), evaluate `currentSpelling = filledSlots.join('')`:
    - **If `currentSpelling !== targetWord` (Wrong Word)**:
      - Set `showErrors = true`.
      - Play a `200Hz` sawtooth error tone (`0.3s`, volume `0.2`).
      - Trigger the `animate-shake` class on `#word-slots` for `400ms`.
    - **If `currentSpelling === targetWord` (Correct Word)**:
      - Set `isTransitioning = true` to lock input during celebration.
      - Play the 3-note ascending triangle-wave fanfare (`vol = 0.2`):
        - `523.25Hz` (C5) at `0ms` (`0.1s` duration)
        - `659.25Hz` (E5) at `100ms` (`0.1s` duration)
        - `783.99Hz` (G5) at `200ms` (`0.2s` duration)
      - Increment `score` by `10` and increment `wordIndex` by `1`.
17. **FR-17 (Word Complete — More Words Remaining in Level)**:
    - When `wordIndex < wordsPerLevel`:
      - Reset `filledSlots = []`, `usedKeyIndices = []`, `showErrors = false`, and save state.
      - Fire celebratory word confetti immediately and every `250ms` for `1000ms` (`particleCount: 20`, `spread: 360`, `startVelocity: 15`, `gravity: 0.4`, `ticks: 300`, `colors: ['#facc15', '#4ade80', '#22d3ee', '#f472b6', '#a78bfa']`, `zIndex: 9999`).
      - After `1000ms`, clear the confetti interval, call `confetti.reset()`, and load the next word (`loadCurrentWord()`).
18. **FR-18 (Level Complete & Game Complete Overlay)**:
    - When `wordIndex >= wordsPerLevel`:
      - Save state and **immediately** invoke `triggerLevelComplete()` with zero delay.
      - Display `#level-overlay` (`fixed inset-0 z-50`):
        - **Levels 1–9 (`level < 10`)**:
          - Title: `"Level Complete!"` (bouncing yellow-to-amber gradient text).
          - Subtitle: `"Get ready for the next level..."`.
        - **Level 10 (`level >= 10`)**:
          - Title: `"Game Complete!"` (pulsing green-to-emerald gradient text).
          - Subtitle: `"Final Score: <score>"`.
      - Display a circular countdown timer badge counting down from `5` to `0` (`1000ms` interval).
      - Call `confetti.reset()` and immediately fire dual side-edge confetti cannons (`x: 0, y: 0.5, angle: 60` and `x: 1, y: 0.5, angle: 120`, `particleCount: 15`, `spread: 55`, `zIndex: 9999`) every `250ms` for the full `5000ms` countdown.
      - When the 5-second countdown completes (`endTransition()`):
        - Call `confetti.reset()` so no stray particles carry into the next level or Home Screen.
        - Hide `#level-overlay`.
        - If `level >= 10`: Clear saved game state (`clearSaveState()`) and return to the Home Screen.
        - If `level < 10`: Increment `level`, reset `filledSlots` and `usedKeyIndices`, generate the next level's words, save state, and load the first word of the new level.

### 4.9. Synthesized Audio & Speech Synthesis
19. **FR-19 (Web Audio API Synthesizer)**:
    - Implement `playTone(freq, type, duration = 0.1, vol = 0.1)` using `window.AudioContext` (or `webkitAudioContext`).
    - Automatically resume `audioCtx` if `audioCtx.state === 'suspended'`.
    - Use an exponential gain ramp down to `0.001` over `duration` to prevent audio clicking artifacts.
    - Exact sound mapping:
      | Action | Frequency (Hz) | Waveform | Duration (s) | Volume |
      | :--- | :--- | :--- | :--- | :--- |
      | Select Grade | `400` | `sine` | `0.1` | `0.1` |
      | Start New Game | `600` | `triangle` | `0.2` | `0.1` |
      | Continue Game | `500` | `square` | `0.2` | `0.1` |
      | Exit to Home | `300` | `sawtooth` | `0.2` | `0.1` |
      | Type Letter | `400 + slotIndex * 50` | `sine` | `0.1` | `0.1` |
      | Remove Letter | `300` | `triangle` | `0.1` | `0.1` |
      | Use Hint | `800` | `sine` | `0.15` | `0.1` |
      | Word Correct | `523.25` → `659.25` → `783.99` | `triangle` | `0.1`, `0.1`, `0.2` | `0.2` |
      | Word Wrong | `200` | `sawtooth` | `0.3` | `0.2` |
20. **FR-20 (Web Speech API Text-to-Speech)**:
    - Automatically speak the current word `300ms` after loading a word.
    - Cancel any in-progress speech (`speechSynthesis.cancel()`) before speaking a new utterance.
    - Configure `SpeechSynthesisUtterance` with `rate = 0.85` and `pitch = 1.2`.
    - Select an English Google voice (`v.lang.startsWith('en-') && v.name.includes('Google')`) when available, falling back gracefully to the browser's default English voice.

### 4.10. LocalStorage Persistence & Recovery
21. **FR-21**: Persist two keys in `window.localStorage`:
    - `t2s_pref_grade`: Stores `"1"`, `"2"`, or `"3"`.
    - `t2s_save_state`: JSON string of the active `GameState` (`isActive`, `category`, `grade`, `level`, `score`, `wordIndex`, `currentLevelWords`, `wordPoolQueue`, `keyboardKeys`, `filledSlots`, `usedKeyIndices`, `hintsRemaining`, `showErrors`).
22. **FR-22**: Gracefully handle corrupted JSON or legacy save payloads:
    - If `JSON.parse` fails, clear `t2s_save_state` and start clean without crashing.
    - If `usedKeyIndices` is missing or mismatched on a saved word with filled slots, reconstruct `usedKeyIndices` by matching each character in `filledSlots` to the first available matching index in `keyboardKeys`.

---

## 5. Non-Goals (Out of Scope)

1. **No Backend Database or User Accounts**: All state is stored locally in `localStorage`. No D1 database tables, server-side sessions, or login screens are required for this version.
2. **No External CDN Scripts or Stylesheets**: Do not load Tailwind, FontAwesome, Google Fonts, or `canvas-confetti` from external CDNs (`cdn.tailwindcss.com`, `cdnjs`, `jsdelivr`, `fonts.googleapis.com`). All libraries and fonts/icons must be installed and bundled locally via `npm`.
3. **No External MP3/WAV Audio Files**: All sound effects and speech must use the browser's native Web Audio API and Web Speech API.
4. **No Custom Word List Editor**: Only the three built-in word categories (`Animals`, `Fry Words`, `Sight Words`) are included in scope.

---

## 6. Design Considerations

### 6.1. Reference Implementation
- The exact visual layout, color palette, spacing, shadows, and interactive states are defined in [`PRD/taptospell_kids_game.html`](./taptospell_kids_game.html) and [`PRD/readme.txt`](./readme.txt).

### 6.2. Typography & Global Styles
- **Font Family**: `Nunito` (weights `600`, `700`, `800`, `900`) bundled locally (e.g., via `@fontsource/nunito`).
- **Viewport Lock & Touch Protection**:
  - Root container: `bg-slate-900 text-white h-[100dvh] w-screen overflow-hidden flex flex-col relative`
  - `user-select: none; -webkit-user-select: none; touch-action: manipulation;`
  - Hide scrollbars via `::-webkit-scrollbar { display: none; }`
- **3D Push-Button Interaction (`.btn-3d`)**:
  - `transition: transform 0.1s, box-shadow 0.1s;`
  - On `:active`: `transform: translateY(4px) !important; box-shadow: 0 0px 0 0 transparent !important;`
- **Responsive Slot Typography (`.word-box-text`)**:
  - `font-size: clamp(1.2rem, 5vw, 2.5rem);`
- **Custom Keyframe Animations**:
  - `animate-pulse-slow`: `pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite`
  - `animate-bounce-slow`: `bounce 2s infinite`
  - `animate-shake`: `shake 0.4s ease-in-out` (`0%, 100%: translateX(0)`, `25%: translateX(-10px)`, `75%: translateX(10px)`)

### 6.3. Icons
- Replace the 3 FontAwesome icons from the HTML prototype (`fa-play`, `fa-house`, `fa-volume-high`) and the lightbulb SVG with clean inline SVG components or a local icon package (e.g., `lucide-react` or `@fortawesome/fontawesome-free` / inline SVGs) so zero external CDN stylesheets are needed.

---

## 7. Technical Considerations

### 7.1. Stack & Project Structure (`D:\Projects\TAPTOSPELL2`)
- **Framework**: React 19 + TypeScript running on the existing Cloudflare Worker (`src/worker.ts`) and client bundle (`src/client.tsx`).
- **Local Dependencies to Install via `npm`**:
  - `canvas-confetti` and `@types/canvas-confetti`
  - `tailwindcss` (or `@tailwindcss/cli` / PostCSS / esbuild CSS bundling)
  - `@fontsource/nunito` (or local font files in `public/fonts/`)
- **Suggested Modular Directory Layout (`src/`)**:
  - `src/data/words.ts` — `WORD_POOLS` definitions, types (`CategoryName`, `GradeLevel`, `WordItem`), and level word generator with pool-cycling logic.
  - `src/lib/audio.ts` — Web Audio API `playTone` helper, sound effect wrappers, and Web Speech API `speakWord` utility.
  - `src/lib/storage.ts` — `localStorage` load/save/clear helpers for `t2s_pref_grade` and `t2s_save_state`.
  - `src/components/HomeScreen.tsx` — Title, Continue Game Banner, Grade Level Selector, and Category Cards.
  - `src/components/GameScreen.tsx` — Top HUD, Animated Word Emoji, Word Slots, On-Screen Keyboard, and Bottom Toolbar (Hint & Listen buttons).
  - `src/components/LevelOverlay.tsx` — Level Complete / Game Complete modal overlay with 5-second countdown ring.
  - `src/App.tsx` — Top-level state machine coordinating screen navigation, keyboard listener, win checks, and confetti intervals.

### 7.2. Build & Asset Serving
- Ensure `npm run build` compiles both the TypeScript/React client (`public/app.js`) and local styles/fonts (`public/styles.css` and font assets) so `src/worker.ts` serves them locally without any external `https://` links in the HTML `<head>`.

---

## 8. Success Metrics

1. **100% Feature Parity with Specification**: Every screen, button state, sound frequency, confetti burst timing, hint edge case, and keyboard shortcut behaves identically to [`PRD/taptospell_kids_game.html`](./taptospell_kids_game.html).
2. **Zero External Network Requests**: Inspecting the browser Network tab while loading and playing the game shows zero requests to external CDNs (`tailwindcss.com`, `googleapis.com`, `cdnjs.cloudflare.com`, `jsdelivr.net`).
3. **Zero Repeat Words Before Pool Exhaustion**: Automated unit tests verify that across a 10-level game in any category and grade, no word repeats within a level, and all words in a category pool are presented before any word is drawn a second time.
4. **Zero Viewport Overflow**: No horizontal or vertical scrollbar appears on `#game-screen` across common mobile (`375×667`), tablet (`768×1024`), and desktop (`1920×1080`) viewports in both portrait and landscape modes.

---

## 9. Open Questions

All core functional, architectural, and design questions have been resolved:
- **Architecture**: Modular React 19 + TypeScript in `src/` on the TanStack/Cloudflare Worker setup (*Resolved: 1A*).
- **Dependencies**: Installed locally via `npm` with zero external CDN scripts (*Resolved: 2B*).
- **Word Cycling**: Shuffle and cycle through the entire category pool across levels before repeating any word (*Resolved: 3B*).
- **PRD Location**: Saved to `PRD/prd-taptospell2.md` (*Resolved: 4A*).

