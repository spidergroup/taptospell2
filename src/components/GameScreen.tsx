import React from 'react';
import { TOTAL_LEVELS, getWordsPerLevel } from '../data/words';
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
  const totalWords = getWordsPerLevel(gameState.grade);

  const keyCount = gameState.keyboardKeys.length;
  const keySizeClasses =
    keyCount > 14
      ? 'w-8 h-10 sm:w-10 sm:h-12 text-lg sm:text-xl'
      : 'w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl';

  const hintsDisabled = gameState.hintsRemaining <= 0;

  return (
    <div id="game-screen" className="flex flex-1 w-full h-full flex-col bg-slate-900 z-10 relative">
      {/* Top HUD (Strict Shrink-0) */}
      <div className="shrink-0 w-full p-2 flex justify-between items-center bg-slate-800 shadow-md h-14 md:h-16 z-20 border-b border-slate-700">
        {/* Left: Progress */}
        <div className="flex items-center gap-2">
          <div className="bg-indigo-900/80 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-indigo-500/50">
            <span className="text-indigo-200 font-bold text-xs mr-1">LEVEL</span>
            <span id="hud-level" className="text-white font-black text-sm md:text-base">
              {gameState.level}
              <span className="text-xs text-indigo-300">/{TOTAL_LEVELS}</span>
            </span>
          </div>
          <div className="bg-blue-900/80 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-blue-500/50">
            <span className="text-blue-200 font-bold text-xs mr-1">WORD</span>
            <span id="hud-word" className="text-white font-black text-sm md:text-base">
              {Math.min(gameState.wordIndex + 1, totalWords)}/{totalWords}
            </span>
          </div>
        </div>

        {/* Right: Score & Exit */}
        <div className="flex items-center gap-2">
          <div className="bg-yellow-900/80 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-yellow-500/50">
            <span className="text-yellow-200 font-bold text-xs mr-1">SCORE</span>
            <span id="hud-score" className="text-yellow-400 font-black text-sm md:text-base">
              {gameState.score}
            </span>
          </div>
          <button
            type="button"
            id="btn-exit-home"
            aria-label="Exit to Home"
            onClick={onExitToHome}
            className="btn-3d bg-rose-600 hover:bg-rose-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full shadow-[0_4px_0_#9f1239] flex items-center justify-center text-sm md:text-base border-2 border-rose-300 cursor-pointer"
          >
            <HouseIcon />
          </button>
        </div>
      </div>

      {/* Middle Area (Flexible, Image + Slots) */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 w-full max-w-5xl mx-auto gap-2 md:gap-4">
        {/* Animated Image Container */}
        <div className="flex-1 min-h-0 flex items-center justify-center w-full">
          <div
            id="word-image"
            onClick={onSpeakWord}
            className="cursor-pointer text-[12vh] md:text-[20vh] animate-pulse-slow drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] leading-none object-contain max-h-[40vh] flex items-center justify-center"
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
              return (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLetter(i);
                  }}
                  className={`aspect-square flex-1 max-w-[3rem] sm:max-w-[4rem] rounded-xl flex flex-col items-center justify-center font-black text-white word-box-text shadow-inner transition-all duration-200 bg-blue-600 cursor-pointer ${
                    isWrongSlot
                      ? 'border-4 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                      : 'border-2 md:border-4 border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.8)]'
                  }`}
                >
                  {letter}
                </div>
              );
            }

            return (
              <div
                key={i}
                className="aspect-square flex-1 max-w-[3rem] sm:max-w-[4rem] rounded-xl flex flex-col items-center justify-center font-black text-white word-box-text shadow-inner transition-all duration-200 bg-slate-800/80 border-2 border-slate-600"
              >
                <div className="w-1/2 h-1 md:h-1.5 bg-slate-600 rounded-full mt-auto mb-2 md:mb-4" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls (Strict Shrink-0, Keyboard + Hint/Sound) */}
      <div className="shrink-0 flex flex-col items-center justify-end px-2 pb-2 md:pb-4 w-full gap-2">
        {/* Keyboard */}
        <div
          id="keyboard"
          className="flex flex-wrap justify-center content-center gap-1 sm:gap-1.5 max-w-[700px] w-full"
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
                  className={`${keySizeClasses} bg-slate-800 rounded-xl font-bold text-slate-700 border-2 border-slate-700 cursor-pointer opacity-40`}
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
                className={`btn-3d ${keySizeClasses} bg-gradient-to-b from-slate-100 to-slate-300 rounded-xl font-black text-slate-800 shadow-[0_5px_0_#94a3b8] border-2 border-white flex items-center justify-center active:shadow-none active:translate-y-[5px] cursor-pointer`}
              >
                {keyChar}
              </button>
            );
          })}
        </div>

        {/* Bottom Tool Bar */}
        <div className="flex w-full max-w-[700px] justify-between items-center px-2 mt-1">
          {/* Hint Button */}
          <button
            id="hint-button"
            type="button"
            disabled={hintsDisabled}
            onClick={onUseHint}
            className={`btn-3d bg-amber-400 hover:bg-amber-300 text-amber-900 font-black py-2 px-4 rounded-xl shadow-[0_4px_0_#b45309] flex items-center justify-center gap-2 text-sm sm:text-base border-2 border-amber-100 min-w-[80px] ${
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
            className="btn-3d bg-cyan-500 hover:bg-cyan-400 text-white font-black py-2 px-4 rounded-xl shadow-[0_4px_0_#0891b2] flex items-center justify-center gap-2 text-sm sm:text-base border-2 border-cyan-200 cursor-pointer"
          >
            <VolumeHighIcon className="w-5 h-5" />
            <span>Listen</span>
          </button>
        </div>
      </div>
    </div>
  );
}

