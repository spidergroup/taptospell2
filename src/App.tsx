import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { LevelOverlay } from './components/LevelOverlay';
import {
  type CategoryName,
  type GradeLevel,
  type NumericGrade,
  TOTAL_LEVELS,
  generateLevelWords,
  getWordsPerLevel,
} from './data/words';
import {
  getAudioMuted,
  initSpeechVoices,
  playContinueGameSound,
  playExitHomeSound,
  playGradeSelectSound,
  playRemoveLetterSound,
  playSentenceAudio,
  playStartGameSound,
  playTypeLetterSound,
  playUseHintSound,
  playWordAudio,
  playWordCorrectFanfare,
  playWordWrongSound,
  setAudioMuted,
  speakWord,
  stopWordAudio,
} from './lib/audio';
import { resetConfetti, startLevelConfetti, startWordConfetti } from './lib/confetti';
import {
  applySmartHintState,
  evaluateSpelling,
  initWordState,
  removeLetterState,
  resolvePhysicalKeyAction,
  typeLetterState,
} from './lib/gameplay';
import {
  getAllSeoPages,
  getSeoForGameSession,
  resolveSeoForPathname,
  updateDocumentSeo,
} from './lib/seo';
import {
  type GameState,
  type KeyboardLayout,
  clearSaveState,
  createInitialGameState,
  loadGradePref,
  loadKeyboardLayoutPref,
  loadSavedGame,
  saveGameState,
  saveGradePref,
  saveKeyboardLayoutPref,
} from './lib/storage';

export interface InitialRouteState {
  screen: 'home' | 'game';
  grade: GradeLevel;
  gameState: GameState;
}

export interface AppProps {
  initialPath?: string;
  initialRoute?: InitialRouteState;
}

export function deriveInitialRouteState(
  initialPath?: string,
  initialRoute?: InitialRouteState
): InitialRouteState {
  if (initialRoute) return initialRoute;
  if (typeof window !== 'undefined') {
    const scriptEl = document.getElementById('__INITIAL_STATE__');
    if (scriptEl && scriptEl.textContent) {
      try {
        const parsed = JSON.parse(scriptEl.textContent);
        if (parsed && parsed.gameState && parsed.screen) return parsed;
      } catch {}
    }
  }
  const path =
    initialPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const routeSeo = resolveSeoForPathname(path);

  if (routeSeo && routeSeo.path === '/high-school') {
    return {
      screen: 'home',
      grade: 'high_school',
      gameState: createInitialGameState('high_school'),
    };
  }

  if (routeSeo && routeSeo.grade && routeSeo.category) {
    const { words, wordPoolQueue } = generateLevelWords(
      routeSeo.category,
      routeSeo.grade,
      1,
      []
    );
    const seeded = initWordState({
      isActive: true,
      category: routeSeo.category,
      grade: routeSeo.grade,
      level: 1,
      score: 0,
      wordIndex: 0,
      currentLevelWords: words,
      wordPoolQueue,
      keyboardKeys: [],
      filledSlots: [],
      usedKeyIndices: [],
      hintsRemaining: 0,
      showErrors: false,
    });
    return {
      screen: 'game',
      grade: routeSeo.grade,
      gameState: seeded,
    };
  }

  return {
    screen: 'home',
    grade: 2,
    gameState: createInitialGameState(2),
  };
}

export function App({ initialPath, initialRoute }: AppProps = {}) {
  const initialRouteState = deriveInitialRouteState(initialPath, initialRoute);
  const [screen, setScreen] = useState<'home' | 'game'>(initialRouteState.screen);
  const [userPrefGrade, setUserPrefGrade] = useState<GradeLevel>(initialRouteState.grade);
  const [gameState, setGameState] = useState<GameState>(initialRouteState.gameState);
  const [savedGameBanner, setSavedGameBanner] = useState<GameState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isWordSuccess, setIsWordSuccess] = useState(false);
  const [hintedKeyIndex, setHintedKeyIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => getAudioMuted());
  const [keyboardLayout, setKeyboardLayout] = useState<KeyboardLayout>(() =>
    loadKeyboardLayoutPref()
  );
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayTimeLeft, setOverlayTimeLeft] = useState(5);

  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const isTransitioningRef = useRef<boolean>(isTransitioning);
  isTransitioningRef.current = isTransitioning;

  const overlayVisibleRef = useRef<boolean>(overlayVisible);
  overlayVisibleRef.current = overlayVisible;

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkWinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      setAudioMuted(next);
      return next;
    });
  }, []);

  const handleToggleKeyboardLayout = useCallback(() => {
    setKeyboardLayout((prev) => {
      const next = prev === 'qwerty' ? 'bank' : 'qwerty';
      saveKeyboardLayoutPref(next);
      return next;
    });
  }, []);

  const syncUrlAndSeo = useCallback(
    (nextScreen: 'home' | 'game', grade: GradeLevel, category?: CategoryName, level?: number) => {
      const seoPage =
        nextScreen === 'game'
          ? getSeoForGameSession(grade, category, level)
          : grade === 'high_school'
            ? resolveSeoForPathname('/high-school') ?? getAllSeoPages()[0]
            : getAllSeoPages()[0];

      updateDocumentSeo(seoPage);

      if (typeof window !== 'undefined' && window.history && window.location) {
        if (window.location.pathname !== seoPage.path) {
          try {
            window.history.pushState({}, '', seoPage.path);
          } catch {
            // Ignore pushState restrictions in sandboxed environments
          }
        }
      }
    },
    []
  );

  const clearAllTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (checkWinTimeoutRef.current) {
      clearTimeout(checkWinTimeoutRef.current);
      checkWinTimeoutRef.current = null;
    }
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
    if (hintPulseTimeoutRef.current) {
      clearTimeout(hintPulseTimeoutRef.current);
      hintPulseTimeoutRef.current = null;
    }
    setIsWordSuccess(false);
    setHintedKeyIndex(null);
    stopWordAudio();
    resetConfetti();
  }, []);

  useEffect(() => {
    initSpeechVoices();

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const directSeoRoute = resolveSeoForPathname(currentPath);

    if (directSeoRoute && directSeoRoute.grade && directSeoRoute.category) {
      saveGradePref(directSeoRoute.grade);
      saveGameState(gameStateRef.current);
      updateDocumentSeo(directSeoRoute);
      const firstWordObj = gameStateRef.current.currentLevelWords[0];
      if (firstWordObj?.w) {
        speakTimeoutRef.current = setTimeout(
          () => playWordAudio(firstWordObj.w, firstWordObj.audio, firstWordObj.examples?.[0]),
          300
        );
      }
    } else {
      const pref = directSeoRoute?.path === '/high-school' ? 'high_school' : loadGradePref();
      setUserPrefGrade(pref);

      const saved = loadSavedGame();
      if (saved && saved.isActive) {
        setGameState(saved);
        setSavedGameBanner(saved);
      }
      updateDocumentSeo(directSeoRoute ?? getAllSeoPages()[0]);
    }

    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const scheduleAutoSpeak = useCallback(
    (word: string, customAudio?: string, exampleSentence?: string) => {
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
      speakTimeoutRef.current = setTimeout(() => {
        playWordAudio(word, customAudio, exampleSentence);
      }, 300);
    },
    []
  );

  const loadWordIntoGame = useCallback(
    (incomingState: GameState) => {
      setIsTransitioning(false);
      isTransitioningRef.current = false;
      setIsWordSuccess(false);
      setHintedKeyIndex(null);

      const prepared = initWordState(incomingState);
      setGameState(prepared);
      gameStateRef.current = prepared;
      saveGameState(prepared);
      syncUrlAndSeo('game', prepared.grade, prepared.category, prepared.level);

      const currentWordObj = prepared.currentLevelWords[prepared.wordIndex];
      if (currentWordObj?.w) {
        scheduleAutoSpeak(currentWordObj.w, currentWordObj.audio, currentWordObj.examples?.[0]);
      }
    },
    [scheduleAutoSpeak, syncUrlAndSeo]
  );

  const triggerLevelComplete = useCallback(
    (completedState: GameState) => {
      setOverlayVisible(true);
      overlayVisibleRef.current = true;
      setOverlayTimeLeft(5);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      startLevelConfetti(5000);

      let timeLeft = 5;
      countdownIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft >= 0) {
          setOverlayTimeLeft(timeLeft);
        }
      }, 1000);

      transitionTimeoutRef.current = setTimeout(() => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        resetConfetti();
        setOverlayVisible(false);
        overlayVisibleRef.current = false;
        setIsWordSuccess(false);

        if (completedState.level >= TOTAL_LEVELS) {
          clearSaveState();
          const resetState = createInitialGameState(userPrefGrade);
          setGameState(resetState);
          gameStateRef.current = resetState;
          setSavedGameBanner(null);
          setIsTransitioning(false);
          isTransitioningRef.current = false;
          setScreen('home');
          syncUrlAndSeo('home', userPrefGrade);
        } else {
          const nextLevel = completedState.level + 1;
          const { words, wordPoolQueue } = generateLevelWords(
            completedState.category,
            completedState.grade,
            nextLevel,
            completedState.wordPoolQueue
          );
          const nextState: GameState = {
            ...completedState,
            level: nextLevel,
            wordIndex: 0,
            currentLevelWords: words,
            wordPoolQueue,
            filledSlots: [],
            usedKeyIndices: [],
            showErrors: false,
          };
          loadWordIntoGame(nextState);
        }
      }, 5000);
    },
    [loadWordIntoGame, syncUrlAndSeo, userPrefGrade]
  );

  const runCheckWin = useCallback(
    (candidateState: GameState) => {
      const evaluation = evaluateSpelling(candidateState);
      if (evaluation === 'incomplete') return;

      if (evaluation === 'wrong') {
        const erroredState: GameState = {
          ...candidateState,
          showErrors: true,
        };
        setIsWordSuccess(false);
        setGameState(erroredState);
        gameStateRef.current = erroredState;
        saveGameState(erroredState);

        playWordWrongSound();
        setIsShaking(true);
        if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = setTimeout(() => {
          setIsShaking(false);
        }, 400);
        return;
      }

      // Word Correct!
      setIsTransitioning(true);
      isTransitioningRef.current = true;
      setIsWordSuccess(true);
      playWordCorrectFanfare();

      const nextScore = candidateState.score + 10;
      const nextWordIndex = candidateState.wordIndex + 1;
      const totalWords = getWordsPerLevel(candidateState.grade);

      if (nextWordIndex >= totalWords) {
        const levelDoneState: GameState = {
          ...candidateState,
          score: nextScore,
          wordIndex: nextWordIndex,
        };
        setGameState(levelDoneState);
        gameStateRef.current = levelDoneState;
        saveGameState(levelDoneState);
        triggerLevelComplete(levelDoneState);
      } else {
        const nextWordPendingState: GameState = {
          ...candidateState,
          score: nextScore,
          wordIndex: nextWordIndex,
          filledSlots: [],
          usedKeyIndices: [],
          showErrors: false,
        };
        setGameState(nextWordPendingState);
        gameStateRef.current = nextWordPendingState;
        saveGameState(nextWordPendingState);

        startWordConfetti(1000);
        transitionTimeoutRef.current = setTimeout(() => {
          resetConfetti();
          loadWordIntoGame(nextWordPendingState);
        }, 1000);
      }
    },
    [loadWordIntoGame, triggerLevelComplete]
  );

  const scheduleCheckWin = useCallback(
    (nextState: GameState) => {
      if (checkWinTimeoutRef.current) {
        clearTimeout(checkWinTimeoutRef.current);
      }
      checkWinTimeoutRef.current = setTimeout(() => {
        runCheckWin(nextState);
      }, 100);
    },
    [runCheckWin]
  );

  const startNewGameSession = useCallback(
    (category: CategoryName, grade: GradeLevel) => {
      clearAllTimers();
      playStartGameSound();

      const { words, wordPoolQueue } = generateLevelWords(category, grade, 1, []);
      const freshState: GameState = {
        isActive: true,
        category,
        grade,
        level: 1,
        score: 0,
        wordIndex: 0,
        currentLevelWords: words,
        wordPoolQueue,
        keyboardKeys: [],
        filledSlots: [],
        usedKeyIndices: [],
        hintsRemaining: 0,
        showErrors: false,
      };

      setOverlayVisible(false);
      overlayVisibleRef.current = false;
      setScreen('game');
      loadWordIntoGame(freshState);
    },
    [clearAllTimers, loadWordIntoGame]
  );

  const handleSelectGradeAndStart = useCallback(
    (grade: NumericGrade) => {
      setUserPrefGrade(grade);
      saveGradePref(grade);
      startNewGameSession(`Grade ${grade}`, grade);
    },
    [startNewGameSession]
  );

  const handleSelectHighSchool = useCallback(() => {
    setUserPrefGrade('high_school');
    saveGradePref('high_school');
    playGradeSelectSound();
    syncUrlAndSeo('home', 'high_school');
  }, [syncUrlAndSeo]);

  const handleStartHighSchoolCategory = useCallback(
    (category: CategoryName) => {
      setUserPrefGrade('high_school');
      saveGradePref('high_school');
      startNewGameSession(category, 'high_school');
    },
    [startNewGameSession]
  );

  const handleContinueGame = useCallback(() => {
    if (!savedGameBanner) return;
    clearAllTimers();
    playContinueGameSound();
    setOverlayVisible(false);
    overlayVisibleRef.current = false;
    setScreen('game');
    loadWordIntoGame(savedGameBanner);
  }, [clearAllTimers, loadWordIntoGame, savedGameBanner]);

  const handleExitToHome = useCallback(() => {
    playExitHomeSound();
    clearAllTimers();
    setIsTransitioning(false);
    isTransitioningRef.current = false;
    setOverlayVisible(false);
    overlayVisibleRef.current = false;

    const current = gameStateRef.current;
    saveGameState(current);
    setSavedGameBanner(current.isActive ? current : null);
    setScreen('home');
    syncUrlAndSeo('home', userPrefGrade);
  }, [clearAllTimers, syncUrlAndSeo, userPrefGrade]);

  const handleTypeLetter = useCallback(
    (char: string, keyIndex: number) => {
      if (isTransitioningRef.current) return;
      const { state: updated, slotIndex } = typeLetterState(gameStateRef.current, char, keyIndex);
      if (slotIndex === -1) return;

      playTypeLetterSound(slotIndex);
      setGameState(updated);
      gameStateRef.current = updated;
      saveGameState(updated);
      scheduleCheckWin(updated);
    },
    [scheduleCheckWin]
  );

  const handleRemoveLetter = useCallback((slotIndex: number) => {
    if (isTransitioningRef.current) return;
    const current = gameStateRef.current;
    if (current.filledSlots[slotIndex] === null || current.filledSlots[slotIndex] === undefined) {
      return;
    }

    const updated = removeLetterState(current, slotIndex);
    playRemoveLetterSound();
    setGameState(updated);
    gameStateRef.current = updated;
    saveGameState(updated);
  }, []);

  const handleUseHint = useCallback(() => {
    if (isTransitioningRef.current) return;
    const { state: updated, applied, keyIndex } = applySmartHintState(gameStateRef.current);
    if (!applied) return;

    playUseHintSound();
    if (keyIndex !== -1) {
      setHintedKeyIndex(keyIndex);
      if (hintPulseTimeoutRef.current) clearTimeout(hintPulseTimeoutRef.current);
      hintPulseTimeoutRef.current = setTimeout(() => {
        setHintedKeyIndex(null);
      }, 800);
    }
    setGameState(updated);
    gameStateRef.current = updated;
    saveGameState(updated);
    scheduleCheckWin(updated);
  }, [scheduleCheckWin]);

  const handleSelectLevel = useCallback(
    (targetLevel: number) => {
      const current = gameStateRef.current;
      if (targetLevel === current.level) return;

      const clampedLevel = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(targetLevel)));
      clearAllTimers();
      playGradeSelectSound();

      setOverlayVisible(false);
      overlayVisibleRef.current = false;
      setIsTransitioning(false);
      isTransitioningRef.current = false;

      const { words, wordPoolQueue } = generateLevelWords(
        current.category,
        current.grade,
        clampedLevel,
        current.wordPoolQueue
      );

      const nextState: GameState = {
        ...current,
        level: clampedLevel,
        wordIndex: 0,
        currentLevelWords: words,
        wordPoolQueue,
        filledSlots: [],
        usedKeyIndices: [],
        showErrors: false,
      };

      loadWordIntoGame(nextState);
    },
    [clearAllTimers, loadWordIntoGame]
  );

  const handleSpeakCurrentWord = useCallback(() => {
    const current = gameStateRef.current;
    const wordObj = current.currentLevelWords[current.wordIndex];
    if (wordObj?.w) {
      playWordAudio(wordObj.w, wordObj.audio);
    }
  }, []);

  const handleSpeakCurrentSentence = useCallback(() => {
    const current = gameStateRef.current;
    const wordObj = current.currentLevelWords[current.wordIndex];
    const sentence = wordObj?.examples?.[0];
    if (sentence) {
      playSentenceAudio(sentence);
    } else if (wordObj?.w) {
      playWordAudio(wordObj.w, wordObj.audio);
    }
  }, []);

  useEffect(() => {
    if (screen !== 'game') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTransitioningRef.current || overlayVisibleRef.current) return;
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;

      const action = resolvePhysicalKeyAction(gameStateRef.current, e.key);
      if (action.type === 'remove') {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
        }
        handleRemoveLetter(action.slotIndex);
      } else if (action.type === 'type') {
        handleTypeLetter(action.char, action.keyIndex);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [screen, handleRemoveLetter, handleTypeLetter]);

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen
          selectedGrade={userPrefGrade}
          savedGame={savedGameBanner}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onSelectGradeAndStart={handleSelectGradeAndStart}
          onSelectHighSchool={handleSelectHighSchool}
          onStartHighSchoolCategory={handleStartHighSchoolCategory}
          onContinueGame={handleContinueGame}
        />
      ) : (
        <GameScreen
          gameState={gameState}
          isShaking={isShaking}
          isWordSuccess={isWordSuccess}
          hintedKeyIndex={hintedKeyIndex}
          isMuted={isMuted}
          keyboardLayout={keyboardLayout}
          onToggleMute={handleToggleMute}
          onToggleKeyboardLayout={handleToggleKeyboardLayout}
          onSelectLevel={handleSelectLevel}
          onExitToHome={handleExitToHome}
          onSpeakWord={handleSpeakCurrentWord}
          onSpeakSentence={handleSpeakCurrentSentence}
          onTypeLetter={handleTypeLetter}
          onRemoveLetter={handleRemoveLetter}
          onUseHint={handleUseHint}
        />
      )}

      <LevelOverlay
        visible={overlayVisible}
        level={gameState.level}
        score={gameState.score}
        timeLeft={overlayTimeLeft}
      />
    </>
  );
}
