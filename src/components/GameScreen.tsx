import React from 'react';
import { TOTAL_LEVELS, getHighSchoolCategoryLabel, getWordsPerLevel } from '../data/words';
import { getSeoForGameSession } from '../lib/seo';
import type { GameState } from '../lib/storage';
import { HouseIcon, LightbulbIcon, VolumeHighIcon } from './Icons';

export interface GameScreenProps {
  gameState: GameState;
  isShaking: boolean;
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

export function GameScreen({
  gameState,
  isShaking,
  onExitToHome,
  onSpeakWord,
  onTypeLetter,
  onRemoveLetter,
  onUseHint,
}: GameScreenProps) {
  const currentWordObj = gameState.currentLevelWords[gameState.wordIndex];
  const targetWord = currentWordObj?.w ?? '';
  const wordEmoji = currentWordObj?.i ?? '🍎';
  const maskedExample = formatMaskedExample(currentWordObj?.examples?.[0], targetWord);
  const totalWords = getWordsPerLevel(gameState.grade);
  const pageSeo = getSeoForGameSession(gameState.grade, gameState.category, gameState.level);

  const keyCount = gameState.keyboardKeys.length;
  const keySizeClasses =
    keyCount > 14
      ? 'w-10 h-12 sm:w-13 sm:h-14 md:w-16 md:h-16 lg:w-[4.25rem] lg:h-[4.25rem] text-xl sm:text-2xl md:text-3xl'
      : 'w-11 h-13 sm:w-14 sm:h-16 md:w-[4.5rem] md:h-[4.5rem] lg:w-20 lg:h-20 text-2xl sm:text-3xl md:text-4xl';

  const slotSizeClasses =
    targetWord.length >= 9
      ? 'max-w-[3rem] sm:max-w-[4.25rem] md:max-w-[5rem] lg:max-w-[5.5rem] word-box-text-compact'
      : 'max-w-[3.75rem] sm:max-w-[5rem] md:max-w-[5.75rem] lg:max-w-[6.5rem] word-box-text';

  const hintsDisabled = gameState.hintsRemaining <= 0;

  return (
    <main
      id="game-screen"
      aria-label={pageSeo.heading}
      className="flex flex-1 w-full h-full flex-col bg-slate-900 z-10 relative"
    >
      {/* Screen-reader accessible SEO heading for the active grade/category game */}
      <h1 className="sr-only">{pageSeo.heading}</h1>

      {/* Top HUD (Strict Shrink-0) */}
      <header className="shrink-0 w-full px-3 sm:px-6 py-2 flex justify-between items-center bg-slate-800 shadow-md h-14 sm:h-16 md:h-20 z-20 border-b border-slate-700">
        {/* Left: Progress */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-indigo-900/90 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl border border-indigo-500/60">
            <span className="text-indigo-200 font-bold text-xs sm:text-sm mr-1">LEVEL</span>
            <span id="hud-level" className="text-white font-black text-base sm:text-xl">
              {gameState.level}
              <span className="text-xs sm:text-sm text-indigo-300">/{TOTAL_LEVELS}</span>
            </span>
          </div>
          <div className="bg-blue-900/90 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl border border-blue-500/60">
            <span className="text-blue-200 font-bold text-xs sm:text-sm mr-1">WORD</span>
            <span id="hud-word" className="text-white font-black text-base sm:text-xl">
              {Math.min(gameState.wordIndex + 1, totalWords)}/{totalWords}
            </span>
          </div>
        </div>

        {/* Center: Mode Badge (Tablet & Desktop) */}
        <div className="hidden md:flex items-center bg-slate-700/80 px-4 py-1.5 rounded-full border border-slate-600 text-slate-200 font-bold text-sm lg:text-base">
          {formatHudModeLabel(gameState)}
        </div>

        {/* Right: Score & Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-yellow-900/90 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl border border-yellow-500/60">
            <span className="text-yellow-200 font-bold text-xs sm:text-sm mr-1">SCORE</span>
            <span id="hud-score" className="text-yellow-400 font-black text-base sm:text-xl">
              {gameState.score}
            </span>
          </div>
          <button
            type="button"
            id="btn-exit-home"
            aria-label="Exit to Home"
            onClick={onExitToHome}
            className="btn-3d bg-rose-600 hover:bg-rose-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-[0_4px_0_#9f1239] flex items-center justify-center text-base md:text-lg border-2 border-rose-300 cursor-pointer"
          >
            <HouseIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      {/* Middle Area (Flexible, Image + Example Clue + Slots) */}
      <section
        aria-label="Word Clue and Spelling Slots"
        className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 py-2 sm:p-4 w-full max-w-6xl mx-auto gap-4 sm:gap-6 md:gap-8"
      >
        {/* Animated Image Container */}
        <div className="shrink-0 flex flex-col items-center justify-center w-full gap-2 sm:gap-3">
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
            className="cursor-pointer shrink-0 text-[clamp(4rem,13vh,9rem)] animate-pulse-slow drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] leading-[1.15] px-4 py-1 flex items-center justify-center rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/60"
          >
            {wordEmoji}
          </div>

          {maskedExample ? (
            <p className="relative z-10 shrink-0 text-slate-200 font-bold text-base sm:text-lg md:text-xl text-center max-w-2xl px-4 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 leading-snug">
              “{maskedExample}”
            </p>
          ) : (
            <p className="relative z-10 shrink-0 text-slate-400 font-semibold text-xs sm:text-sm text-center">
              Tap the picture or Listen to hear the word
            </p>
          )}
        </div>

        {/* Word Slots container */}
        <div
          id="word-slots"
          onClick={onSpeakWord}
          className={`cursor-pointer shrink-0 flex flex-row flex-nowrap w-full max-w-[96%] sm:max-w-[92%] justify-center gap-1.5 sm:gap-2.5 md:gap-3 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {Array.from({ length: targetWord.length }).map((_, i) => {
            const letter = gameState.filledSlots[i] ?? null;
            const isWrongSlot = Boolean(letter && gameState.showErrors && letter !== targetWord[i]);

            if (letter) {
              return (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLetter(i);
                  }}
                  className={`aspect-square flex-1 ${slotSizeClasses} rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-inner transition-all duration-200 bg-blue-600 cursor-pointer ${
                    isWrongSlot
                      ? 'border-4 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.85)]'
                      : 'border-2 md:border-4 border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.85)]'
                  }`}
                >
                  {letter}
                </div>
              );
            }

            return (
              <div
                key={i}
                className={`aspect-square flex-1 ${slotSizeClasses} rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-inner transition-all duration-200 bg-slate-800/90 border-2 sm:border-3 border-slate-600`}
              >
                <div className="w-1/2 h-1 sm:h-1.5 bg-slate-500 rounded-full mt-auto mb-2 sm:mb-3 md:mb-4" />
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Controls (Strict Shrink-0, Keyboard + Hint/Sound) */}
      <section
        aria-label="On-Screen Keyboard and Game Actions"
        className="shrink-0 flex flex-col items-center justify-end px-2 sm:px-4 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-5 w-full gap-2.5 sm:gap-3.5"
      >
        {/* Keyboard */}
        <div
          id="keyboard"
          className="flex flex-wrap justify-center content-center gap-1.5 sm:gap-2.5 max-w-3xl lg:max-w-4xl w-full"
        >
          {gameState.keyboardKeys.map((keyChar, index) => {
            const isUsed = Boolean(
              gameState.usedKeyIndices && gameState.usedKeyIndices.includes(index)
            );

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
                  className={`${keySizeClasses} bg-slate-800 rounded-xl sm:rounded-2xl font-bold text-slate-600 border-2 border-slate-700 cursor-pointer opacity-40`}
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
                className={`btn-3d ${keySizeClasses} bg-gradient-to-b from-slate-100 to-slate-300 rounded-xl sm:rounded-2xl font-black text-slate-800 shadow-[0_5px_0_#94a3b8] border-2 border-white flex items-center justify-center active:shadow-none active:translate-y-[5px] cursor-pointer`}
              >
                {keyChar}
              </button>
            );
          })}
        </div>

        {/* Bottom Tool Bar */}
        <div className="flex w-full max-w-3xl lg:max-w-4xl justify-between items-center px-1 sm:px-2 mt-0.5">
          {/* Hint Button */}
          <button
            id="hint-button"
            type="button"
            disabled={hintsDisabled}
            onClick={onUseHint}
            className={`btn-3d bg-amber-400 hover:bg-amber-300 text-amber-950 font-black py-3 px-5 sm:py-3.5 sm:px-8 rounded-2xl shadow-[0_5px_0_#b45309] flex items-center justify-center gap-2.5 text-base sm:text-xl border-2 border-amber-100 min-w-[104px] sm:min-w-[136px] ${
              hintsDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
            }`}
          >
            <div
              className={`flex items-center gap-2 ${hintsDisabled ? 'opacity-50 grayscale' : ''}`}
            >
              <LightbulbIcon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-md" />
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
            className="btn-3d bg-cyan-500 hover:bg-cyan-400 text-white font-black py-3 px-6 sm:py-3.5 sm:px-9 rounded-2xl shadow-[0_5px_0_#0891b2] flex items-center justify-center gap-2.5 text-base sm:text-xl border-2 border-cyan-200 cursor-pointer min-w-[128px] sm:min-w-[160px]"
          >
            <VolumeHighIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Listen</span>
          </button>
        </div>
      </section>
    </main>
  );
}
