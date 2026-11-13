import React from 'react';
import {
  type CategoryName,
  type GradeLevel,
  type NumericGrade,
  HIGH_SCHOOL_CATEGORIES,
  getHighSchoolCategoryLabel,
  getWordsPerLevel,
} from '../data/words';
import { getAllSeoPages } from '../lib/seo';
import type { GameState } from '../lib/storage';
import { PlayIcon, VolumeHighIcon, VolumeMuteIcon } from './Icons';

export interface HomeScreenProps {
  selectedGrade: GradeLevel;
  savedGame: GameState | null;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onSelectGradeAndStart: (grade: NumericGrade) => void;
  onSelectHighSchool: () => void;
  onStartHighSchoolCategory: (category: CategoryName) => void;
  onContinueGame: () => void;
}

const GRADE_OPTIONS: Array<{ grade: NumericGrade; label: string }> = [
  { grade: 1, label: '1st Grade' },
  { grade: 2, label: '2nd Grade' },
  { grade: 3, label: '3rd Grade' },
  { grade: 4, label: '4th Grade' },
  { grade: 5, label: '5th Grade' },
  { grade: 6, label: '6th Grade' },
];

export function formatContinueDetails(savedGame: GameState): string {
  if (savedGame.grade === 'high_school') {
    const label = getHighSchoolCategoryLabel(String(savedGame.category));
    return `${label} • High School • Level ${savedGame.level}`;
  }
  const catStr = String(savedGame.category || `Grade ${savedGame.grade}`);
  if (catStr === `Grade ${savedGame.grade}`) {
    return `Grade ${savedGame.grade} • Level ${savedGame.level}`;
  }
  return `${catStr} • Grade ${savedGame.grade} • Level ${savedGame.level}`;
}

export function HomeScreen({
  selectedGrade,
  savedGame,
  isMuted = false,
  onToggleMute,
  onSelectGradeAndStart,
  onSelectHighSchool,
  onStartHighSchoolCategory,
  onContinueGame,
}: HomeScreenProps) {
  const isHighSchoolSelected = selectedGrade === 'high_school';
  const seoPages = getAllSeoPages();

  return (
    <main
      id="home-screen"
      aria-label="TapToSpell Home Screen"
      className="flex-1 flex flex-col items-center p-4 sm:p-6 md:p-8 overflow-y-auto w-full h-full z-10 relative bg-slate-900"
    >
      <div className="w-full max-w-6xl flex flex-col items-center pb-12">
        {/* Title Header */}
        <header className="w-full flex flex-col items-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-5 sm:mb-7 md:mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-lg py-2">
            TapToSpell!
          </h1>
        </header>

        {/* Continue Game Banner */}
        {savedGame && savedGame.isActive && (
          <section
            id="continue-banner"
            aria-label="Resume Saved Game"
            className="flex mb-8 w-full max-w-4xl bg-gradient-to-r from-green-500 to-emerald-700 rounded-3xl p-5 sm:p-7 shadow-[0_8px_0_#065f46] border-2 border-green-300 flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                Game in Progress!
              </h2>
              <p id="continue-details" className="text-green-50 font-bold text-base sm:text-xl">
                {formatContinueDetails(savedGame)}
              </p>
            </div>
            <button
              type="button"
              onClick={onContinueGame}
              className="btn-3d bg-white text-green-700 font-black text-xl sm:text-2xl px-8 py-4 sm:px-10 sm:py-5 rounded-2xl shadow-[0_6px_0_#d1d5db] w-full sm:w-auto flex-shrink-0 hover:bg-green-50 flex items-center justify-center gap-3 cursor-pointer"
            >
              <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Continue</span>
            </button>
          </section>
        )}

        {/* Grade Selection (Grades 1–6 immediately start a game; High School reveals categories) */}
        <section
          aria-label="Select Grade Level"
          className="bg-slate-800/95 p-5 sm:p-7 md:p-8 rounded-3xl border-2 border-slate-700 shadow-2xl mb-10 w-full flex flex-col items-center"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl text-white font-black mb-2 text-center">
            Select Grade Level to Play
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mb-6 text-center max-w-2xl">
            Tap Grades 1–6 to start immediately, or choose High School to pick a topic category.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 w-full">
            {GRADE_OPTIONS.map(({ grade, label }) => {
              const isSelected = selectedGrade === grade;
              const wordsCount = getWordsPerLevel(grade);
              return (
                <button
                  key={grade}
                  type="button"
                  id={`btn-pref-${grade}`}
                  onClick={() => onSelectGradeAndStart(grade)}
                  className={
                    isSelected
                      ? 'btn-3d flex flex-col items-center justify-center py-5 px-4 sm:py-7 sm:px-5 rounded-2xl sm:rounded-3xl font-black text-xl sm:text-2xl md:text-3xl bg-blue-600 text-white border-2 border-blue-300 ring-4 ring-blue-400/40 shadow-[0_6px_0_#1e3a8a] transition-all cursor-pointer'
                      : 'btn-3d flex flex-col items-center justify-center py-5 px-4 sm:py-7 sm:px-5 rounded-2xl sm:rounded-3xl font-black text-xl sm:text-2xl md:text-3xl bg-slate-700 text-white border-2 border-slate-500 shadow-[0_6px_0_#334155] transition-all hover:bg-slate-600 cursor-pointer'
                  }
                >
                  <span>{label}</span>
                  <span
                    className={`mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                      isSelected
                        ? 'bg-blue-800/70 text-blue-100'
                        : 'bg-slate-800/80 text-slate-200'
                    }`}
                  >
                    {wordsCount} words / level
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              id="btn-pref-high_school"
              onClick={onSelectHighSchool}
              className={
                isHighSchoolSelected
                  ? 'btn-3d col-span-2 sm:col-span-3 lg:col-span-2 flex flex-col items-center justify-center py-5 px-4 sm:py-7 sm:px-6 rounded-2xl sm:rounded-3xl font-black text-xl sm:text-2xl md:text-3xl bg-purple-600 text-white border-2 border-purple-300 ring-4 ring-purple-400/40 shadow-[0_6px_0_#4c1d95] transition-all cursor-pointer'
                  : 'btn-3d col-span-2 sm:col-span-3 lg:col-span-2 flex flex-col items-center justify-center py-5 px-4 sm:py-7 sm:px-6 rounded-2xl sm:rounded-3xl font-black text-xl sm:text-2xl md:text-3xl bg-slate-700 text-white border-2 border-slate-500 shadow-[0_6px_0_#334155] transition-all hover:bg-slate-600 cursor-pointer'
              }
            >
              <span>🎓 High School</span>
              <span
                className={`mt-2 px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold ${
                  isHighSchoolSelected
                    ? 'bg-purple-800/70 text-purple-100'
                    : 'bg-slate-800/80 text-slate-200'
                }`}
              >
                {getWordsPerLevel('high_school')} words / level • 7 Categories
              </span>
            </button>
          </div>
        </section>

        {/* High School Category Selection */}
        {isHighSchoolSelected && (
          <section
            id="high-school-categories"
            aria-label="High School Topic Categories"
            className="w-full flex flex-col items-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 text-white text-center">
              Select a High School Category!
            </h2>
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {HIGH_SCHOOL_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  id={`btn-cat-${cat.key}`}
                  onClick={() => onStartHighSchoolCategory(cat.label)}
                  className={`btn-3d flex flex-col items-center justify-center p-5 sm:p-7 md:p-8 bg-gradient-to-b ${cat.gradientClass} rounded-3xl ${cat.shadowClass} border-2 ${cat.borderClass} hover:brightness-110 cursor-pointer min-h-[140px] sm:min-h-[170px]`}
                >
                  <span className="text-5xl sm:text-6xl md:text-7xl mb-3" aria-hidden="true">
                    {cat.emoji}
                  </span>
                  <span className="font-black text-xl sm:text-2xl md:text-3xl drop-shadow-md text-center leading-tight">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* How to Use Tutorial Video */}
        <section
          id="how-to-play-video"
          aria-label="How to Use TapToSpell Video Tutorial"
          className="mt-10 bg-slate-800/95 p-5 sm:p-7 md:p-8 rounded-3xl border-2 border-slate-700 shadow-2xl w-full max-w-4xl flex flex-col items-center"
        >
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl text-white font-black">
                How to Use TapToSpell
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-1">
                Watch a quick walkthrough on how to play directly here or on YouTube.
              </p>
            </div>
            <a
              id="link-youtube-howto"
              href="https://www.youtube.com/watch?v=NR8sOxgxeV0"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-3d bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base px-5 py-3 rounded-2xl border-2 border-red-400 shadow-[0_4px_0_#991b1b] flex items-center gap-2 flex-shrink-0 transition-all"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Watch on YouTube</span>
            </a>
          </div>
          <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-inner">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/NR8sOxgxeV0?rel=0"
              title="How to Use TapToSpell - Tutorial Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>

        {/* Crawlable SEO Curriculum Directory & Internal Links */}
        <footer
          aria-label="Spelling Curriculum Directory"
          className="mt-10 pt-5 border-t border-slate-800/80 w-full text-center text-xs sm:text-sm text-slate-400"
        >
          <details className="group">
            <summary className="cursor-pointer list-none inline-flex items-center gap-2 font-bold text-slate-300 hover:text-white px-4 py-2 rounded-full bg-slate-800/70 border border-slate-700/80 transition-colors">
              <span>More: Browse All Grade &amp; Category Pages (3,875+ Words)</span>
              <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <nav
              aria-label="Grade and Category Spelling Pages"
              className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2.5"
            >
              {seoPages.map((p) => (
                <a
                  key={p.path}
                  href={p.path}
                  onClick={(e) => {
                    if (p.path === '/') {
                      e.preventDefault();
                      return;
                    }
                    if (p.path === '/high-school') {
                      e.preventDefault();
                      onSelectHighSchool();
                      return;
                    }
                    if (p.grade && p.grade !== 'high_school') {
                      e.preventDefault();
                      onSelectGradeAndStart(p.grade);
                      return;
                    }
                    if (p.grade === 'high_school' && p.category) {
                      e.preventDefault();
                      onStartHighSchoolCategory(p.category);
                    }
                  }}
                  className="hover:text-white underline decoration-slate-600 underline-offset-2 transition-colors"
                >
                  {p.heading}
                </a>
              ))}
            </nav>
          </details>
        </footer>
      </div>
    </main>
  );
}
