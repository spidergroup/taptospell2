import React, { useState } from 'react';
import { TOTAL_LEVELS, getHighSchoolCategoryLabel, getWordsPerLevel } from '../data/words';
import { getSeoForGameSession } from '../lib/seo';
import type { GameState, KeyboardLayout } from '../lib/storage';
import {
  ChevronDownIcon,
  HouseIcon,
  KeyboardIcon,
  LightbulbIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
} from './Icons';

export interface GameScreenProps {
  gameState: GameState;
  isShaking: boolean;
  isWordSuccess?: boolean;
  hintedKeyIndex?: number | null;
  isMuted?: boolean;
  keyboardLayout?: KeyboardLayout;
  onToggleMute?: () => void;
  onToggleKeyboardLayout?: () => void;
  onSelectLevel?: (level: number) => void;
  onExitToHome: () => void;
  onSpeakWord: () => void;
  onTypeLetter: (char: string, keyIndex: number) => void;
  onRemoveLetter: (slotIndex: number) => void;
  onUseHint: () => void;
}

function formatMaskedExample(example: string | undefined, targetWord: string): string | null {
  if (!example || !targetWord) return null;
  const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  if (!regex.test(example)) return null;
  return example.replace(regex, '_____');
}

function formatHudModeLabel(gameState: GameState): string {
  if (gameState.grade === 'high_school') {
    return `High School • ${getHighSchoolCategoryLabel(String(gameState.category))}`;
  }
  return `Grade ${gameState.grade}`;
}

const QWERTY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function GameScreen({
  gameState,
  isShaking,
  isWordSuccess = false,
  hintedKeyIndex = null,
  isMuted = false,
  keyboardLayout = 'bank',
  onToggleMute,
  onToggleKeyboardLayout,
  onSelectLevel,
  onExitToHome,
  onSpeakWord,
  onTypeLetter,
  onRemoveLetter,
  onUseHint,
}: GameScreenProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentWordObj = gameState.currentLevelWords[gameState.wordIndex];
  const targetWord = currentWordObj?.w ?? '';
  const wordEmoji = currentWordObj?.i ?? '🍎';
  const maskedExample = formatMaskedExample(currentWordObj?.examples?.[0], targetWord);
  const totalWords = getWordsPerLevel(gameState.grade);
  const pageSeo = getSeoForGameSession(gameState.grade, gameState.category, gameState.level);

  const wordLen = Math.max(1, targetWord.length);
  const twoRows = wordLen > 10;
  const slotsPerRow = twoRows ? Math.ceil(wordLen / 2) : wordLen;

  const keyCount = gameState.keyboardKeys.length;
  const bankCols = keyCount > 14 ? Math.ceil(keyCount / 3) : Math.ceil(keyCount / 2);

  const hintsDisabled = gameState.hintsRemaining <= 0;

  const hasProgress =
    gameState.score > 0 ||
    gameState.wordIndex > 0 ||
    gameState.level > 1 ||
    gameState.filledSlots.some(Boolean);

  const handleExitClick = () => {
    if (hasProgress) {
      setShowExitConfirm(true);
    } else {
      onExitToHome();
    }
  };

  const handleRemoveLastFilled = () => {
    for (let i = gameState.filledSlots.length - 1; i >= 0; i--) {
      if (gameState.filledSlots[i] !== null && gameState.filledSlots[i] !== undefined) {
        onRemoveLetter(i);
        return;
      }
    }
  };

  return (
    <main
      id="game-screen"
      aria-label={pageSeo.heading}
      className="flex flex-1 w-full h-full flex-col bg-slate-900 z-10 relative overflow-hidden"
    >
      {/* Screen-reader accessible SEO heading for the active grade/category game */}
      <h1 className="sr-only">{pageSeo.heading}</h1>

      {/* Top HUD (Exit on Top-Left away from Score) */}
      <header className="game-landscape-hud shrink-0 w-full px-3 sm:px-6 py-2 flex justify-between items-center bg-slate-800 shadow-md h-14 sm:h-16 md:h-20 z-20 border-b border-slate-700">
        {/* Left: Exit Button + Level & Word */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            id="btn-exit-home"
            aria-label="Exit to Home"
            title="Exit to Home"
            onClick={handleExitClick}
            className="btn-3d bg-rose-600 hover:bg-rose-500 text-white w-11 h-11 md:w-12 md:h-12 rounded-full shadow-[0_4px_0_#9f1239] flex items-center justify-center text-base md:text-lg border-2 border-rose-300 cursor-pointer touch-manipulation shrink-0"
          >
            <HouseIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <div className="relative">
            <label htmlFor="hud-level-select" className="sr-only">
              Select Level
            </label>
            <div
              title="Click to change Level"
              className="bg-indigo-900/90 hover:bg-indigo-800/90 active:scale-95 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl border border-indigo-500/60 hover:border-indigo-400 flex items-center gap-1 cursor-pointer transition-all shadow-sm group"
            >
              <span className="text-indigo-200 font-bold text-xs sm:text-sm pointer-events-none">
                🏁 <span className="hidden xs:inline">LVL</span>
              </span>
              <span
                id="hud-level"
                className="text-white font-black text-base sm:text-xl pointer-events-none flex items-center"
              >
                {gameState.level}
                <span className="text-xs sm:text-sm text-indigo-300 ml-0.5">/{TOTAL_LEVELS}</span>
              </span>
              <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300 group-hover:text-white transition-colors pointer-events-none" />
              <select
                id="hud-level-select"
                aria-label="Select Level"
                value={gameState.level}
                onChange={(e) => onSelectLevel?.(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-slate-800 text-white"
              >
                {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((lvl) => (
                  <option
                    key={lvl}
                    value={lvl}
                    className="bg-slate-800 text-white font-bold py-1"
                  >
                    Level {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-900/90 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl border border-blue-500/60 flex items-center gap-1">
            <span className="text-blue-200 font-bold text-xs sm:text-sm">📖</span>
            <span id="hud-word" className="text-white font-black text-base sm:text-xl">
              {`${Math.min(gameState.wordIndex + 1, totalWords)}/${totalWords}`}
            </span>
          </div>
        </div>

        {/* Center: Mode Badge (Tablet & Desktop) */}
        <div className="hidden md:flex items-center bg-slate-700/80 px-4 py-1.5 rounded-full border border-slate-600 text-slate-200 font-bold text-sm lg:text-base">
          {formatHudModeLabel(gameState)}
        </div>

        {/* Right: Score & Audio Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-yellow-900/90 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl border border-yellow-500/60 flex items-center gap-1">
            <span className="text-yellow-200 font-bold text-xs sm:text-sm">⭐</span>
            <span id="hud-score" className="text-yellow-400 font-black text-base sm:text-xl">
              {gameState.score}
            </span>
          </div>

          {onToggleMute && (
            <button
              type="button"
              id="btn-toggle-sound"
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              onClick={onToggleMute}
              className={`btn-3d w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-lg border-2 cursor-pointer touch-manipulation transition-all shrink-0 ${
                isMuted
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-400 border-slate-500 shadow-[0_4px_0_#334155]'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-300 shadow-[0_4px_0_#0e7490]'
              }`}
            >
              {isMuted ? (
                <VolumeMuteIcon className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <VolumeHighIcon className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Play + Controls Container (Stacks vertically in portrait; 2-column in sideways phone landscape) */}
      <div className="game-landscape-body flex-1 min-h-0 flex flex-col w-full overflow-hidden">
        {/* Clue Area (Emoji + Masked Sentence + Tap-to-hear cue) */}
        <section
          aria-label="Word Clue"
          className="game-landscape-left flex-1 min-h-0 flex flex-col items-center justify-evenly px-3 py-2 sm:p-4 w-full max-w-6xl mx-auto gap-2 sm:gap-3"
        >
          <div className="shrink-0 flex flex-col items-center justify-center w-full gap-1.5 sm:gap-2.5">
            <div
              id="word-image"
              role="button"
              tabIndex={0}
              aria-label="Listen to word pronunciation"
              onClick={onSpeakWord}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSpeakWord();
                }
              }}
              className="game-landscape-emoji cursor-pointer shrink-0 text-[clamp(4.25rem,14vh,9.5rem)] animate-pulse-slow drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] leading-[1.15] px-4 py-1 flex items-center justify-center rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/60 touch-manipulation select-none"
            >
              {wordEmoji}
            </div>

            {maskedExample && (
              <p className="relative z-10 shrink-0 text-slate-100 font-bold text-sm sm:text-lg md:text-xl text-center max-w-2xl px-4 py-1.5 rounded-2xl bg-slate-800/85 border border-slate-700 leading-snug">
                “{maskedExample}”
              </p>
            )}

            <button
              type="button"
              onClick={onSpeakWord}
              className="text-xs sm:text-sm text-cyan-300/90 hover:text-cyan-200 font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/70 cursor-pointer touch-manipulation"
            >
              <span>🔊 Tap picture or boxes to hear</span>
            </button>
          </div>
        </section>

        {/* Answer Slots + Keyboard + Bottom Toolbar */}
        <section
          aria-label="Spelling Slots, On-Screen Keyboard and Game Actions"
          className="game-landscape-right shrink-0 flex flex-col items-center justify-end px-2 sm:px-4 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-5 w-full gap-2.5 sm:gap-3.5"
        >
          {/* Word Slots container (Container-query sized, splits 11+ letter words into 2 rows) */}
          <div
            id="word-slots"
            onClick={onSpeakWord}
            style={
              {
                containerType: 'inline-size',
                '--per': slotsPerRow,
                '--slot-size':
                  'min(calc((100cqw - (var(--per) - 1) * 0.5rem) / var(--per)), 13vh, 108px)',
              } as React.CSSProperties
            }
            className={`cursor-pointer shrink-0 flex flex-wrap w-full max-w-[min(96vw,1080px)] justify-center gap-1.5 sm:gap-2 ${
              isShaking ? 'animate-shake' : ''
            }`}
          >
            {Array.from({ length: targetWord.length }).map((_, i) => {
              const letter = gameState.filledSlots[i] ?? null;
              const isWrongSlot = Boolean(
                letter && gameState.showErrors && letter !== targetWord[i]
              );

              if (letter) {
                const successClass = isWordSuccess
                  ? 'bg-emerald-500 border-2 md:border-4 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.9)] animate-pop-success scale-105'
                  : isWrongSlot
                    ? 'border-4 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.85)] bg-blue-600'
                    : 'border-2 md:border-4 border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.85)] bg-blue-600';

                return (
                  <div
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLetter(i);
                    }}
                    className={`word-slot-box aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-inner transition-all duration-200 cursor-pointer touch-manipulation select-none ${successClass}`}
                  >
                    {letter}
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className="word-slot-box aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-inner transition-all duration-200 bg-slate-800/90 border-2 sm:border-3 border-slate-600 select-none"
                >
                  <div className="w-1/2 h-1 sm:h-1.5 bg-slate-500 rounded-full mt-auto mb-2 sm:mb-3" />
                </div>
              );
            })}
          </div>

          {/* Keyboard Layout Toggle */}
          {onToggleKeyboardLayout && (
            <div className="flex items-center justify-center w-full max-w-[1000px]">
              <button
                type="button"
                id="btn-layout-toggle"
                onClick={onToggleKeyboardLayout}
                className="text-xs sm:text-sm font-bold py-1 px-3.5 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation shadow-sm"
                title="Toggle between curated Letter Bank and standard QWERTY keyboard layout"
              >
                <KeyboardIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span>
                  Layout:{' '}
                  <strong className="text-white">
                    {keyboardLayout === 'qwerty' ? 'QWERTY' : 'Letter Bank'}
                  </strong>
                </span>
              </button>
            </div>
          )}

          {/* Keyboard */}
          {keyboardLayout === 'qwerty' ? (
            /* QWERTY Layout */
            <div
              id="keyboard"
              className="flex flex-col items-center gap-1.5 sm:gap-2 max-w-[1000px] w-full px-1"
            >
              {QWERTY_ROWS.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex justify-center content-center gap-1 sm:gap-1.5 md:gap-2 w-full"
                >
                  {row.map((char) => {
                    const unusedIdx = gameState.keyboardKeys.findIndex(
                      (k, idx) => k === char && !gameState.usedKeyIndices?.includes(idx)
                    );
                    const isAvailable = unusedIdx !== -1;
                    const isUsedInWord = gameState.filledSlots.includes(char);
                    const isInWordBank = gameState.keyboardKeys.includes(char);
                    const isHinted = isAvailable && hintedKeyIndex === unusedIdx;

                    if (isAvailable) {
                      return (
                        <button
                          key={char}
                          type="button"
                          onClick={() => onTypeLetter(char, unusedIdx)}
                          className={`btn-3d flex-1 max-w-[3.5rem] sm:max-w-[4.25rem] min-h-[44px] h-11 sm:h-14 md:h-16 min-w-[1.9rem] sm:min-w-[2.5rem] rounded-xl font-black text-slate-800 shadow-[0_4px_0_#94a3b8] border-2 border-white flex items-center justify-center text-lg sm:text-2xl cursor-pointer touch-manipulation select-none active:shadow-none active:translate-y-[4px] ${
                            isHinted
                              ? 'bg-amber-300 text-amber-950 border-amber-200 ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)] scale-110 z-10 animate-hint-pulse'
                              : 'bg-gradient-to-b from-slate-100 to-slate-300'
                          }`}
                        >
                          {char}
                        </button>
                      );
                    }

                    if (isUsedInWord) {
                      return (
                        <button
                          key={char}
                          type="button"
                          onClick={() => {
                            const slotIdx = gameState.filledSlots.lastIndexOf(char);
                            if (slotIdx !== -1) {
                              onRemoveLetter(slotIdx);
                            }
                          }}
                          className="flex-1 max-w-[3.5rem] sm:max-w-[4.25rem] min-h-[44px] h-11 sm:h-14 md:h-16 min-w-[1.9rem] sm:min-w-[2.5rem] bg-slate-800 rounded-xl font-bold text-slate-500 border-2 border-slate-700 cursor-pointer opacity-40 flex items-center justify-center text-lg sm:text-2xl touch-manipulation select-none"
                        >
                          {char}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={char}
                        type="button"
                        disabled
                        className={`flex-1 max-w-[3.5rem] sm:max-w-[4.25rem] min-h-[44px] h-11 sm:h-14 md:h-16 min-w-[1.9rem] sm:min-w-[2.5rem] rounded-xl font-bold border-2 flex items-center justify-center text-lg sm:text-2xl touch-manipulation select-none cursor-not-allowed ${
                          isInWordBank
                            ? 'bg-slate-800 text-slate-600 border-slate-700 opacity-30'
                            : 'bg-slate-900/60 text-slate-700 border-slate-800/80 opacity-20'
                        }`}
                      >
                        {char}
                      </button>
                    );
                  })}

                  {/* Backspace Key in Row 3 */}
                  {rowIdx === 2 && (
                    <button
                      type="button"
                      id="btn-qwerty-backspace"
                      aria-label="Backspace"
                      title="Delete Last Letter"
                      onClick={handleRemoveLastFilled}
                      className="btn-3d flex-1 max-w-[4rem] sm:max-w-[4.75rem] min-h-[44px] h-11 sm:h-14 md:h-16 min-w-[2.5rem] bg-rose-700 hover:bg-rose-600 rounded-xl font-black text-white shadow-[0_4px_0_#9f1239] border-2 border-rose-300 flex items-center justify-center text-base sm:text-xl cursor-pointer touch-manipulation select-none active:shadow-none active:translate-y-[4px]"
                    >
                      ⌫
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Even Grid Letter Bank Layout */
            <div
              id="keyboard"
              style={{
                gridTemplateColumns: `repeat(${bankCols}, minmax(0, 1fr))`,
              }}
              className="grid gap-1.5 sm:gap-2.5 max-w-[1000px] w-full px-1"
            >
              {gameState.keyboardKeys.map((keyChar, index) => {
                const isUsed = Boolean(
                  gameState.usedKeyIndices && gameState.usedKeyIndices.includes(index)
                );
                const isHinted = !isUsed && hintedKeyIndex === index;

                if (isUsed) {
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const slotIdx = gameState.usedKeyIndices
                          ? gameState.usedKeyIndices.indexOf(index)
                          : -1;
                        if (slotIdx !== -1) {
                          onRemoveLetter(slotIdx);
                        }
                      }}
                      className="min-h-[44px] h-12 sm:h-14 md:h-16 w-full bg-slate-800/70 rounded-xl sm:rounded-2xl font-bold text-slate-500 border-2 border-slate-700 cursor-pointer opacity-40 flex items-center justify-center text-xl sm:text-2xl md:text-3xl touch-manipulation select-none"
                    >
                      {keyChar}
                    </button>
                  );
                }

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onTypeLetter(keyChar, index)}
                    className={`btn-3d min-h-[44px] h-12 sm:h-14 md:h-16 w-full rounded-xl sm:rounded-2xl font-black shadow-[0_5px_0_#94a3b8] border-2 flex items-center justify-center text-xl sm:text-2xl md:text-3xl active:shadow-none active:translate-y-[5px] cursor-pointer touch-manipulation select-none ${
                      isHinted
                        ? 'bg-amber-300 text-amber-950 border-amber-100 ring-4 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,1)] scale-105 z-10 animate-hint-pulse'
                        : 'bg-gradient-to-b from-slate-100 to-slate-300 text-slate-800 border-white'
                    }`}
                  >
                    {keyChar}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Tool Bar (Listen is the largest primary CTA; Hint shows clear label) */}
          <div className="flex w-full max-w-[1000px] justify-between items-center gap-3 px-1 mt-0.5">
            {/* Hint Button */}
            <button
              id="hint-button"
              type="button"
              disabled={hintsDisabled}
              onClick={onUseHint}
              className={`btn-3d bg-amber-400 hover:bg-amber-300 text-amber-950 font-black py-3 px-4 sm:py-3.5 sm:px-6 rounded-2xl shadow-[0_5px_0_#b45309] flex items-center justify-center gap-2 text-base sm:text-xl border-2 border-amber-100 min-h-[48px] touch-manipulation ${
                hintsDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
              }`}
            >
              <div
                className={`flex items-center gap-1.5 sm:gap-2 ${
                  hintsDisabled ? 'opacity-50 grayscale' : ''
                }`}
              >
                <LightbulbIcon className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
                <span className="text-base sm:text-xl font-black whitespace-nowrap">
                  Hint ×{Math.max(0, gameState.hintsRemaining)}
                </span>
              </div>
            </button>

            {/* Listen Button (Largest primary action button) */}
            <button
              id="listen-button"
              type="button"
              onClick={onSpeakWord}
              className="btn-3d flex-1 max-w-[260px] sm:max-w-[320px] bg-cyan-500 hover:bg-cyan-400 text-white font-black py-3.5 px-6 sm:py-4 sm:px-10 rounded-2xl shadow-[0_5px_0_#0891b2] flex items-center justify-center gap-2.5 text-lg sm:text-2xl border-2 border-cyan-200 cursor-pointer min-h-[52px] touch-manipulation"
            >
              <VolumeHighIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              <span>Listen</span>
            </button>
          </div>
        </section>
      </div>

      {/* Leave Game Confirmation Modal */}
      {showExitConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-game-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-800 border-2 border-slate-600 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
            <h2 id="leave-game-title" className="text-2xl sm:text-3xl font-black text-white mb-2">
              Leave game?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-6">
              Your progress is saved! You can continue anytime from the Home Screen.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="btn-3d flex-1 py-3 rounded-2xl font-black text-base sm:text-lg bg-slate-600 hover:bg-slate-500 text-white border-2 border-slate-400 shadow-[0_4px_0_#334155] cursor-pointer"
              >
                Keep Playing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onExitToHome();
                }}
                className="btn-3d flex-1 py-3 rounded-2xl font-black text-base sm:text-lg bg-rose-600 hover:bg-rose-500 text-white border-2 border-rose-300 shadow-[0_4px_0_#9f1239] cursor-pointer"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
