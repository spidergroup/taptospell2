import React from 'react';
import { type CategoryName, type GradeLevel, TOTAL_LEVELS } from '../data/words';

export interface LevelOverlayProps {
  visible: boolean;
  level: number;
  score: number;
  timeLeft: number;
  grade?: GradeLevel;
  category?: CategoryName;
}

export function LevelOverlay({
  visible,
  level,
  score,
  timeLeft,
  grade,
  category,
}: LevelOverlayProps) {
  if (!visible) return null;

  const isGameComplete = level >= TOTAL_LEVELS;
  const gradeLabel =
    category && String(category).trim().length > 0
      ? String(category)
      : grade === 'high_school'
        ? 'High School'
        : grade
          ? `Grade ${grade}`
          : '';

  return (
    <div
      id="level-overlay"
      className="flex fixed inset-0 bg-slate-900/95 z-50 flex-col items-center justify-center backdrop-blur-md"
    >
      <h1
        id="overlay-title"
        className={
          isGameComplete
            ? 'text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-yellow-300 to-emerald-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] mb-4 animate-bounce-slow text-center p-4'
            : 'text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] mb-6 animate-bounce-slow text-center p-4'
        }
      >
        {isGameComplete ? '🎉 Congratulations! 🎉' : 'Level Complete!'}
      </h1>
      <p id="overlay-subtitle" className="text-xl sm:text-2xl md:text-3xl text-white font-bold mb-8 text-center px-4 max-w-2xl">
        {isGameComplete
          ? `Amazing job! You completed all ${TOTAL_LEVELS} levels${gradeLabel ? ` of ${gradeLabel}` : ''}! Final Score: ${score}`
          : 'Get ready for the next level...'}
      </p>

      {/* Timer ring */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center rounded-full bg-slate-800 border-8 border-slate-700 shadow-2xl">
        <span id="overlay-timer" className="text-6xl sm:text-7xl font-black text-amber-400">
          {timeLeft}
        </span>
      </div>
    </div>
  );
}

