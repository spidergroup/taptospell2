import React from 'react';
import { TOTAL_LEVELS } from '../data/words';

export interface LevelOverlayProps {
  visible: boolean;
  level: number;
  score: number;
  timeLeft: number;
}

export function LevelOverlay({ visible, level, score, timeLeft }: LevelOverlayProps) {
  if (!visible) return null;

  const isGameComplete = level >= TOTAL_LEVELS;

  return (
    <div
      id="level-overlay"
      className="flex fixed inset-0 bg-slate-900/95 z-50 flex-col items-center justify-center backdrop-blur-md"
    >
      <h1
        id="overlay-title"
        className={
          isGameComplete
            ? 'text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] mb-6 animate-pulse-slow text-center p-4'
            : 'text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] mb-6 animate-bounce-slow text-center p-4'
        }
      >
        {isGameComplete ? 'Game Complete!' : 'Level Complete!'}
      </h1>
      <p id="overlay-subtitle" className="text-2xl md:text-3xl text-white font-bold mb-8 text-center px-4">
        {isGameComplete ? `Final Score: ${score}` : 'Get ready for the next level...'}
      </p>

      {/* Timer ring */}
      <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-slate-800 border-8 border-slate-700 shadow-2xl">
        <span id="overlay-timer" className="text-6xl font-black text-amber-400">
          {timeLeft}
        </span>
      </div>
    </div>
  );
}

