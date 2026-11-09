import React from 'react';
import { TOTAL_LEVELS, getWordsPerLevel } from '../data/words';
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
  const currentWordObj = gameState.currentLevelWords[gameState.wordIndex];
  const targetWord = currentWordObj?.w ?? '';
  const wordEmoji = currentWordObj?.i ?? '🍎';
  const totalWords = getWordsPerLevel(gameState.grade);
  const pageSeo = getSeoForGameSession(gameState.grade, gameState.category, gameState.level);

  const keyCount = gameState.keyboardKeys.length;
  const keySizeClasses =
    keyCount > 14
      ? 'w-8 h-11 sm:w-10 sm:h-12 min-w-[2rem] sm:min-w-[2.5rem] min-h-[2.75rem] text-lg sm:text-xl'
      : 'w-10 h-12 sm:w-12 sm:h-14 min-w-[2.25rem] sm:min-w-[2.75rem] min-h-[2.75rem] sm:min-h-[3.25rem] text-xl sm:text-2xl';

  const hintsDisabled = gameState.hintsRemaining <= 0;

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

      {/* Top HUD (Strict Shrink-0) */}
      <header className="shrink-0 w-full p-2 flex justify-between items-center bg-slate-800 shadow-md h-14 md:h-16 z-20 border-b border-slate-700">
        {/* Left: Progress */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <label htmlFor="hud-level-select" className="sr-only">Select Level</label>
            <div
              title="Click to change Level"
              className="bg-indigo-900/80 hover:bg-indigo-800/90 active:scale-95 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-indigo-500/50 hover:border-indigo-400 flex items-center gap-1 cursor-pointer transition-all shadow-sm group"
            >
              <span className="text-indigo-200 font-bold text-xs pointer-events-none">LEVEL</span>
              <span id="hud-level" className="text-white font-black text-sm md:text-base pointer-events-none flex items-center">
                {gameState.level}
              </span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-indigo-300 group-hover:text-white transition-colors pointer-events-none" />
              <select
                id="hud-level-select"
                aria-label="Select Level"
                value={gameState.level}
                onChange={(e) => onSelectLevel?.(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-slate-800 text-white"
              >
                {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-slate-800 text-white font-bold py-1">
                    Level {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-blue-900/80 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-blue-500/50">
            <span className="text-blue-200 font-bold text-xs mr-1">WORD</span>
            <span id="hud-word" className="text-white font-black text-sm md:text-base">
              {`${Math.min(gameState.wordIndex + 1, totalWords)}/${totalWords}`}
            </span>
          </div>
        </div>

        {/* Right: Score, Audio Toggle & Exit */}
        <div className="flex items-center gap-2">
          <div className="bg-yellow-900/80 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-yellow-500/50">
            <span className="text-yellow-200 font-bold text-xs mr-1">SCORE</span>
            <span id="hud-score" className="text-yellow-400 font-black text-sm md:text-base">
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
              className={`btn-3d w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base border-2 cursor-pointer touch-manipulation transition-all ${
                isMuted
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-400 border-slate-500 shadow-[0_4px_0_#334155]'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-300 shadow-[0_4px_0_#0e7490]'
              }`}
            >
              {isMuted ? (
                <VolumeMuteIcon className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <VolumeHighIcon className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          )}

          <button
            type="button"
            id="btn-exit-home"
            aria-label="Exit to Home"
            onClick={onExitToHome}
            className="btn-3d bg-rose-600 hover:bg-rose-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full shadow-[0_4px_0_#9f1239] flex items-center justify-center text-sm md:text-base border-2 border-rose-300 cursor-pointer touch-manipulation"
          >
            <HouseIcon />
          </button>
        </div>
      </header>

      {/* Middle Area (Flexible, Image + Slots) */}
      <section
        aria-label="Word Clue and Spelling Slots"
        className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 w-full max-w-5xl mx-auto gap-2 md:gap-4"
      >
        {/* Animated Image Container */}
        <div className="flex-1 min-h-0 flex items-center justify-center w-full">
          <div
            id="word-image"
            role="button"
            tabIndex={0}
            aria-label="Listen to word pronunciation"
            onClick={onSpeakWord}
            className="cursor-pointer text-[12vh] md:text-[20vh] animate-pulse-slow drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] leading-none object-contain max-h-[40vh] flex items-center justify-center touch-manipulation select-none"
          >
            {wordEmoji}
          </div>
        </div>

        {/* Word Slots container */}
        <div
          id="word-slots"
          onClick={onSpeakWord}
          className={`cursor-pointer shrink-0 flex flex-row flex-nowrap w-full max-w-[90%] justify-center gap-1 sm:gap-2 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {Array.from({ length: targetWord.length }).map((_, i) => {
            const letter = gameState.filledSlots[i] ?? null;
            const isWrongSlot = Boolean(letter && gameState.showErrors && letter !== targetWord[i]);

            if (letter) {
              const successClass = isWordSuccess
                ? 'bg-emerald-500 border-2 md:border-4 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.9)] animate-pop-success scale-105'
                : isWrongSlot
                  ? 'border-4 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] bg-blue-600'
                  : 'border-2 md:border-4 border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.8)] bg-blue-600';

              return (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLetter(i);
                  }}
                  className={`aspect-square flex-1 max-w-[3rem] sm:max-w-[4rem] rounded-xl flex flex-col items-center justify-center font-black text-white word-box-text shadow-inner transition-all duration-200 cursor-pointer touch-manipulation select-none ${successClass}`}
                >
                  {letter}
                </div>
              );
            }

            return (
              <div
                key={i}
                className="aspect-square flex-1 max-w-[3rem] sm:max-w-[4rem] rounded-xl flex flex-col items-center justify-center font-black text-white word-box-text shadow-inner transition-all duration-200 bg-slate-800/80 border-2 border-slate-600 select-none"
              >
                <div className="w-1/2 h-1 md:h-1.5 bg-slate-600 rounded-full mt-auto mb-2 md:mb-4" />
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Controls (Strict Shrink-0, Keyboard + Hint/Sound) */}
      <section
        aria-label="On-Screen Keyboard and Game Actions"
        className="shrink-0 flex flex-col items-center justify-end px-2 pb-2 md:pb-4 w-full gap-2"
      >
        {/* Keyboard Layout Toggle */}
        {onToggleKeyboardLayout && (
          <div className="flex items-center justify-center w-full max-w-[700px]">
            <button
              type="button"
              id="btn-layout-toggle"
              onClick={onToggleKeyboardLayout}
              className="text-xs font-bold py-1 px-3 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation shadow-sm"
              title="Toggle between curated Letter Bank and standard QWERTY keyboard layout"
            >
              <KeyboardIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Layout: <strong className="text-white">{keyboardLayout === 'qwerty' ? 'QWERTY' : 'Letter Bank'}</strong>
              </span>
            </button>
          </div>
        )}

        {/* Keyboard */}
        {keyboardLayout === 'qwerty' ? (
          /* QWERTY Layout */
          <div
            id="keyboard"
            className="flex flex-col items-center gap-1 sm:gap-1.5 max-w-[720px] w-full px-1"
          >
            {QWERTY_ROWS.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center content-center gap-1 sm:gap-1.5 w-full">
                {row.map((char) => {
                  // Find if character is present and unused in keyboardKeys
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
                        className={`btn-3d flex-1 max-w-[2.75rem] h-10 sm:h-12 min-w-[1.75rem] sm:min-w-[2.25rem] rounded-xl font-black text-slate-800 shadow-[0_4px_0_#94a3b8] border-2 border-white flex items-center justify-center text-base sm:text-xl cursor-pointer touch-manipulation select-none active:shadow-none active:translate-y-[4px] ${
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
                        className="flex-1 max-w-[2.75rem] h-10 sm:h-12 min-w-[1.75rem] sm:min-w-[2.25rem] bg-slate-800 rounded-xl font-bold text-slate-600 border-2 border-slate-700 cursor-pointer opacity-40 flex items-center justify-center text-base sm:text-xl touch-manipulation select-none"
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
                      className={`flex-1 max-w-[2.75rem] h-10 sm:h-12 min-w-[1.75rem] sm:min-w-[2.25rem] rounded-xl font-bold border-2 flex items-center justify-center text-base sm:text-xl touch-manipulation select-none cursor-not-allowed ${
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
                    className="btn-3d flex-1 max-w-[3.25rem] h-10 sm:h-12 min-w-[2.5rem] bg-rose-700 hover:bg-rose-600 rounded-xl font-black text-white shadow-[0_4px_0_#9f1239] border-2 border-rose-300 flex items-center justify-center text-sm sm:text-base cursor-pointer touch-manipulation select-none active:shadow-none active:translate-y-[4px]"
                  >
                    ⌫
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Standard Letter Bank Layout */
          <div
            id="keyboard"
            className="flex flex-wrap justify-center content-center gap-1.5 sm:gap-2 max-w-[700px] w-full px-1"
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
                    className={`${keySizeClasses} bg-slate-800 rounded-xl font-bold text-slate-700 border-2 border-slate-700 cursor-pointer opacity-40 touch-manipulation select-none`}
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
                  className={`btn-3d ${keySizeClasses} rounded-xl font-black shadow-[0_5px_0_#94a3b8] border-2 flex items-center justify-center active:shadow-none active:translate-y-[5px] cursor-pointer touch-manipulation select-none ${
                    isHinted
                      ? 'bg-amber-300 text-amber-950 border-amber-100 ring-4 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,1)] scale-110 z-10 animate-hint-pulse'
                      : 'bg-gradient-to-b from-slate-100 to-slate-300 text-slate-800 border-white'
                  }`}
                >
                  {keyChar}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Tool Bar */}
        <div className="flex w-full max-w-[700px] justify-between items-center px-2 mt-1">
          {/* Hint Button */}
          <button
            id="hint-button"
            type="button"
            disabled={hintsDisabled}
            onClick={onUseHint}
            className={`btn-3d bg-amber-400 hover:bg-amber-300 text-amber-900 font-black py-2 px-4 rounded-xl shadow-[0_4px_0_#b45309] flex items-center justify-center gap-2 text-sm sm:text-base border-2 border-amber-100 min-w-[88px] min-h-[44px] touch-manipulation ${
              hintsDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
            }`}
          >
            <div
              className={`flex items-center gap-2 ${hintsDisabled ? 'opacity-50 grayscale' : ''}`}
            >
              <LightbulbIcon />
              <span className="text-xl sm:text-2xl font-black">
                {Math.max(0, gameState.hintsRemaining)}
              </span>
            </div>
          </button>

          {/* Sound Button */}
          <button
            id="listen-button"
            type="button"
            onClick={onSpeakWord}
            className="btn-3d bg-cyan-500 hover:bg-cyan-400 text-white font-black py-2 px-5 rounded-xl shadow-[0_4px_0_#0891b2] flex items-center justify-center gap-2 text-sm sm:text-base border-2 border-cyan-200 min-h-[44px] cursor-pointer touch-manipulation"
          >
            <VolumeHighIcon className="w-5 h-5" />
            <span>Listen</span>
          </button>
        </div>
      </section>
    </main>
  );
}
