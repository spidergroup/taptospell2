# TapToSpell - Kids Spelling & Learning Game (Complete Specification & Prompt Blueprint)

## 1. Overview & Architecture
Create a complete, self-contained, single-file HTML5 educational spelling game for kids named **"TapToSpell!"** (`taptospell_kids_game.html`).
- **Single-File Architecture**: All HTML, CSS, and JavaScript must be contained within one `.html` file with zero build steps required.
- **Tech Stack & CDN Libraries**:
  - **Tailwind CSS** (`https://cdn.tailwindcss.com`) with custom theme extensions (`Nunito` font family, `pulse-slow`, `bounce-slow`, and `shake` keyframe animations).
  - **Google Fonts**: `Nunito` (weights: 600, 700, 800, 900).
  - **FontAwesome 6.4.0** (`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`) for UI icons.
  - **Canvas Confetti 1.6.0** (`https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js`) for word and level completion celebrations.
  - **Web Audio API (`AudioContext`)** for synthesized sound effects (key taps, removal, hints, word win fanfare, wrong word buzzer, navigation tones) with no external audio files needed.
  - **Web Speech API (`window.speechSynthesis`)** for kid-friendly Text-to-Speech (TTS) word pronunciation.
  - **Browser `localStorage`** for persisting grade preferences and active game progress across page reloads.

---

## 2. Visual Design, Responsive Layout & Custom Styling
- **Theme**: Dark slate background (`bg-slate-900`), vibrant gradient cards and buttons, 3D tactile push-buttons (`.btn-3d` with bottom shadow that translates down `4px` and removes shadow on `:active`), rounded corners (`rounded-xl` to `rounded-3xl`), and high-contrast playful typography.
- **Viewport & Touch Handling**:
  - Full-viewport locked layout (`h-[100dvh] w-screen overflow-hidden flex flex-col relative`) so the game screen never scrolls vertically or horizontally on mobile, tablet, or desktop (both portrait and landscape).
  - Disable text selection (`user-select: none`) and set `touch-action: manipulation` to prevent accidental double-tap zoom on touch devices.
  - Hide scrollbars (`::-webkit-scrollbar { display: none; }`).
  - Dynamic responsive font sizing for answer slots using `.word-box-text { font-size: clamp(1.2rem, 5vw, 2.5rem); }`.
- **Custom Tailwind Animations**:
  - `animate-pulse-slow`: `pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite`
  - `animate-bounce-slow`: `bounce 2s infinite`
  - `animate-shake`: `shake 0.4s ease-in-out` (`0%, 100%: translateX(0)`, `25%: translateX(-10px)`, `75%: translateX(10px)`)

---

## 3. Word Databases (`WORD_POOLS`)
Include three built-in word categories, each mapping uppercase words (`w`) to a large expressive emoji (`i`):

1. **Animals** (20 words):
   - `CAT` (🐱), `DOG` (🐶), `COW` (🐮), `PIG` (🐷), `BIRD` (🐦), `BEAR` (🐻), `LION` (🦁), `FISH` (🐟), `FROG` (🐸), `DUCK` (🦆), `HORSE` (🐴), `SHEEP` (🐑), `FOX` (🦊), `WOLF` (🐺), `TIGER` (🐯), `ZEBRA` (🦓), `MOUSE` (🐭), `SNAKE` (🐍), `CRAB` (🦀), `SEAL` (🦭)
2. **Fry Words** (16 words):
   - `THE` (💬), `AND` (💬), `THAT` (💬), `HAVE` (💬), `THEY` (💬), `WITH` (💬), `THIS` (💬), `FROM` (💬), `WORD` (📝), `WHAT` (❓), `SOME` (💬), `TIME` (⏱️), `MORE` (➕), `LOOK` (👀), `MAKE` (🛠️), `THEM` (💬)
3. **Sight Words** (12 words):
   - `SEE` (👀), `PLAY` (⚽), `JUMP` (🏃), `RUN` (💨), `STOP` (🛑), `GO` (🟢), `FAST` (🚀), `SLOW` (🐢), `UP` (⬆️), `DOWN` (⬇️), `HERE` (👇), `HELP` (🤝)

---

## 4. Screen Structure & UI Components

### A. Home Screen (`#home-screen`)
- Scrollable container (`overflow-y-auto`) centered with `max-w-5xl`.
- **Title**: Large gradient heading `"TapToSpell!"` (`from-pink-400 via-purple-400 to-indigo-400`).
- **Continue Game Banner (`#continue-banner`)**:
  - Hidden by default; automatically shown if an active saved game exists in `localStorage` (`t2s_save_state`).
  - Green gradient card displaying `"Game in Progress!"`, details (`"<Category> • Grade <grade> • Level <level>"`), and a 3D `"Continue"` button with play icon that resumes the exact saved state.
- **Grade Level Selector**:
  - Card allowing the player to choose between 3 grade levels (persisted to `localStorage` under `t2s_pref_grade`, defaulting to Grade 2):
    - **1st Grade**: `1 word / level`
    - **2nd Grade**: `3 words / level`
    - **3rd Grade**: `5 words / level`
  - Selected grade button is highlighted in blue (`bg-blue-600`, `scale-105`, `border-blue-400`, `shadow-[0_6px_0_#1e3a8a]`), while unselected buttons use slate styling.
- **Category Cards ("Start a New Game!")**:
  - 3-column responsive grid (`grid-cols-1 sm:grid-cols-3`) of large 3D gradient cards:
    - **Animals**: Orange-to-red gradient with 🦁 icon.
    - **Fry Words**: Blue-to-indigo gradient with 💬 icon.
    - **Sight Words**: Green-to-teal gradient with 👀 icon.
  - Clicking any category initializes a new 10-level game (`TOTAL_LEVELS = 10`) for that category using the selected grade preference.

### B. Game Screen (`#game-screen`)
Organized into three non-overlapping vertical sections inside a full-height flex column:
1. **Top HUD Bar (`shrink-0 h-14 md:h-16`)**:
   - **Left side**:
     - `LEVEL` badge showing `<currentLevel>/10`.
     - `WORD` badge showing `<wordIndex + 1>/<wordsPerLevel>`.
   - **Right side**:
     - `SCORE` badge showing current score (`+10` points per completed word).
     - Red circular 3D Home/Exit button (`fa-house`) that stops any active transitions/confetti, saves state, and returns to the Home Screen.
2. **Middle Play Area (`flex-1 min-h-0`)**:
   - **Animated Word Emoji (`#word-image`)**: Large centered emoji (`text-[12vh] md:text-[20vh] animate-pulse-slow`) that speaks the target word via TTS when clicked/tapped.
   - **Answer Box / Word Slots (`#word-slots`)**:
     - Single-row flex container (`flex-nowrap justify-center gap-1 sm:gap-2`) with one square slot per character of the target word (`aspect-square flex-1 max-w-[3rem] sm:max-w-[4rem]`).
     - **Empty Slot**: Dark translucent box (`bg-slate-800/80 border-slate-600`) with a bottom dash indicator. Clicking the slots container speaks the word.
     - **Filled Slot**: Bright blue tile (`bg-blue-600 border-blue-400`) displaying the uppercase letter. Clicking a filled slot removes that letter from the slot (calling `removeLetter(slotIndex)` without triggering TTS).
     - **Wrong Word Error Highlight**: When all slots are filled but the spelling is incorrect, slots containing an incorrect letter (`letter !== targetWord[i]`) are highlighted with a glowing red border (`border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]`) and the `#word-slots` container plays the `animate-shake` animation.
3. **Bottom Controls (`shrink-0`)**:
   - **On-Screen Character Keyboard (`#keyboard`)**:
     - Contains all letters of `targetWord` plus at least 5 random uppercase distractor letters (minimum 12 keys total: `Math.max(12, targetWord.length + 5)`), shuffled randomly.
     - Adaptive key sizing (`w-8 h-10 sm:w-10 sm:h-12` when `> 14` keys, otherwise `w-10 h-12 sm:w-12 sm:h-14`).
     - **Unused Key**: Light 3D button (`from-slate-100 to-slate-300 text-slate-800`). Clicking moves that specific key instance into the first empty answer slot.
     - **Used Key**: Dimmed button (`bg-slate-800 text-slate-700 opacity-40 cursor-pointer`). Clicking a dimmed used key removes its letter from the corresponding answer slot and restores the key.
   - **Bottom Toolbar**:
     - **Hint Button (`#hint-button`)**: Amber 3D button with a lightbulb SVG icon and remaining hint count. Each word starts with `Math.max(0, targetWord.length - 1)` hints. Disabled and grayed out when `hintsRemaining <= 0`.
     - **Listen Button**: Cyan 3D button (`fa-volume-high` + `"Listen"`) that pronounces the current word using TTS.

### C. Level / Game Complete Overlay (`#level-overlay`)
- Full-screen blurred modal overlay (`fixed inset-0 bg-slate-900/95 z-50 backdrop-blur-md`).
- **Level Complete (Levels 1–9)**:
  - Title: `"Level Complete!"` in bouncing yellow-to-amber gradient text.
  - Subtitle: `"Get ready for the next level..."`.
- **Game Complete (Level 10)**:
  - Title: `"Game Complete!"` in pulsing green-to-emerald gradient text.
  - Subtitle: `"Final Score: <score>"`.
- **Countdown Timer Ring**: Circular badge showing a 5-second countdown (`5` down to `0`) before automatically advancing to the next level (or returning to the Home Screen and clearing saved state upon finishing Level 10).

---

## 5. Detailed Gameplay Mechanics & Interactive Behavior

### A. Exact Duplicate Letter Key Tracking (`usedKeyIndices`)
- Maintain `gameState.usedKeyIndices` as an array parallel to `gameState.filledSlots` (same length as `targetWord`, initialized with `null`).
- **Clicking a Duplicate Letter**: When the keyboard has multiple buttons with the same letter (e.g., two `'O'` buttons at indices `2` and `9`) and the player clicks the button at index `9`:
  - `filledSlots[firstEmpty]` is set to `'O'`, and `usedKeyIndices[firstEmpty]` is set to `9`.
  - Only the exact clicked button at index `9` is marked as used (`gameState.usedKeyIndices.includes(index)`), NOT the other `'O'` at index `2`.
- **Removing a Letter**:
  - Clicking a filled answer slot at `slotIndex` (or clicking the dimmed key at `keyIndex`) clears both `filledSlots[slotIndex] = null` and `usedKeyIndices[slotIndex] = null`, returning the letter to the exact keyboard button it came from.

### B. Physical Keyboard Support (`keydown` Listener)
- Typing on a physical keyboard while on `#game-screen` (when `#level-overlay` is hidden and not currently in a win transition) works identically to clicking the on-screen characters:
  - **Letter Keys (`A`–`Z` / `a`–`z`)**:
    - If there is an empty slot in `filledSlots` and an unused matching key in `keyboardKeys`, it selects that key (`typeLetter(char, keyIndex)`).
    - If no unused key for that letter remains (or all slots are full), pressing that letter removes the last matching occurrence of that letter from `filledSlots` (`removeLetter(slotIdx)`), acting like clicking the answer character.
  - **`Backspace` / `Delete`**:
    - Removes the letter in the rightmost filled slot (`removeLetter(i)`).
  - Ignore modifier combinations (`ctrlKey`, `altKey`, `metaKey`) and key auto-repeat (`e.repeat`).

### C. Smart Hint System (`useHint()`)
- Each word provides `targetWord.length - 1` hints (minimum `0`).
- Clicking the Hint button finds the first slot index `i` where `filledSlots[i] !== targetWord[i]`:
  - Clears any wrong letter currently in slot `i` (freeing its `usedKeyIndices[i]`).
  - Finds an unused key index in `keyboardKeys` matching `targetWord[i]`.
  - If all instances of `targetWord[i]` on the keyboard are currently placed in other wrong slots (`sIdx !== i`), it reclaims the key index from one of those wrong slots and clears that wrong slot.
  - Places `targetWord[i]` into `filledSlots[i]`, records its key index in `usedKeyIndices[i]`, decrements `hintsRemaining`, clears error highlights, plays a high chime (`800Hz`), and checks for a win.

### D. Win Check, Confetti Timing & Transitions (`checkWin()`)
- Triggered `100ms` after filling the last empty slot:
- **If Spelling is Incorrect (`currentSpelling !== targetWord`)**:
  - Sets `gameState.showErrors = true`, re-renders slots so mismatched letters show a red border, plays a `200Hz` sawtooth error buzz, and shakes `#word-slots` for `400ms`.
- **If Spelling is Correct (`currentSpelling === targetWord`)**:
  - Locks input during transition (`isTransitioning = true`).
  - Plays a 3-note ascending triangle-wave fanfare: `C5 (523.25Hz)` at `0ms`, `E5 (659.25Hz)` at `100ms`, `G5 (783.99Hz)` at `200ms`.
  - Adds `10` to `gameState.score`, increments `gameState.wordIndex`, and updates the HUD.
  - **Case 1: More Words Remaining in Current Level (`wordIndex < totalWords`)**:
    - Immediately fires a 1-second burst of celebratory word confetti (`zIndex: 9999`) every `250ms`.
    - After `1000ms`, clears the interval, calls `confetti.reset()` to clean up particles, and loads the next word (`loadCurrentWord()`).
  - **Case 2: Level Completed (`wordIndex >= totalWords`)**:
    - Immediately calls `triggerLevelComplete()` right after completing the level (no delay).
    - `triggerLevelComplete()` displays `#level-overlay`, resets any prior confetti canvas, and immediately fires continuous left-and-right edge confetti cannons (`angle: 60` from `x: 0` and `angle: 120` from `x: 1`, `zIndex: 9999` so confetti renders above the `z-50` overlay) every `250ms` during the 5-second countdown.
    - When the 5-second countdown finishes, `endTransition()` calls `confetti.reset()` so zero confetti carries over into the newly started level, hides `#level-overlay`, increments `gameState.level`, generates the new level's words, and loads the first word.

### E. Audio & Speech Synthesis Details
- **Synthesized Sound Effects (`playTone(freq, type, duration, vol)`)**:
  - Grade change: `400Hz` sine (`0.1s`)
  - Start new game: `600Hz` triangle (`0.2s`)
  - Continue game: `500Hz` square (`0.2s`)
  - Exit to home: `300Hz` sawtooth (`0.2s`)
  - Type letter: `400 + slotIndex * 50 Hz` sine (`0.1s`)
  - Remove letter: `300Hz` triangle (`0.1s`)
  - Use hint: `800Hz` sine (`0.15s`)
  - Word correct: `523.25Hz`, `659.25Hz`, `783.99Hz` triangle fanfare
  - Word wrong: `200Hz` sawtooth (`0.3s`)
- **Text-to-Speech (`speakWord()`)**:
  - Automatically speaks the word `300ms` after loading a word, or when the player clicks the emoji image, the Listen button, or an empty slot area.
  - Uses `rate = 0.85` and `pitch = 1.2` for a friendly voice, preferring a Google English (`en-*`) voice when available.

### F. State Persistence (`localStorage`)
- `t2s_pref_grade`: Stores the user's selected grade (`1`, `2`, or `3`).
- `t2s_save_state`: Stores the serialized `gameState` object (`isActive`, `category`, `grade`, `level`, `score`, `wordIndex`, `currentLevelWords`, `keyboardKeys`, `filledSlots`, `usedKeyIndices`, `hintsRemaining`, `showErrors`).
- Automatically saved on every move, hint, word advance, and level transition, and cleared upon completing Level 10.

