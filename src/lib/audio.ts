type OscillatorWaveType = OscillatorType;

export const AUDIO_MUTED_KEY = 't2s_audio_muted';

let sharedAudioCtx: AudioContext | null = null;
let memoryMuted = false;
let isAudioUnlocked = false;
let unlockListenersAttached = false;
let manifestLoaded = false;
let customAudioWords = new Set<string>();
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeLetterAudio: HTMLAudioElement | null = null;

// Silent 1-sample WAV data URI to switch iOS Safari's audio session to Media/Playback
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export function getAudioMuted(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = window.localStorage.getItem(AUDIO_MUTED_KEY);
      if (val !== null) return val === 'true';
    } catch {
      // ignore
    }
  }
  return memoryMuted;
}

export function setAudioMuted(muted: boolean): void {
  memoryMuted = muted;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(AUDIO_MUTED_KEY, String(muted));
    } catch {
      // ignore
    }
  }
  if (muted) {
    stopWordAudio();
  }
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' && typeof globalThis === 'undefined') {
    return null;
  }
  const g = (typeof window !== 'undefined' ? window : globalThis) as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioCtxCtor = g.AudioContext || g.webkitAudioContext;
  if (!AudioCtxCtor) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtxCtor();
  }
  return sharedAudioCtx;
}

export function registerCustomWordAudio(words: string[]): void {
  manifestLoaded = true;
  for (const w of words) {
    if (w) customAudioWords.add(w.toLowerCase());
  }
}

export function hasCustomAudio(word: string, customAudioUrl?: string): boolean {
  if (customAudioUrl) return true;
  return customAudioWords.has(word.toLowerCase());
}

/**
 * Unlocks iOS/iPadOS Safari Web Audio and Web Speech engines.
 * Must be triggered by a user interaction (touchstart, touchend, click, keydown).
 */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;

  // 1. Tell iOS WebKit to use 'playback' session so hardware silent switch does not mute Web Audio
  if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
    try {
      (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
    } catch {
      // ignore
    }
  }

  // 2. Play a brief inaudible HTML5 audio element to force iOS into AVAudioSessionCategoryPlayback
  try {
    const silentAudio = new Audio(SILENT_WAV_DATA_URI);
    silentAudio.volume = 0.01;
    const p = silentAudio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {});
    }
  } catch {
    // ignore
  }

  // 3. Unlock Web Audio Context by playing a 1-sample silent buffer
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      const resumePromise = ctx.resume();
      if (resumePromise && typeof resumePromise.catch === 'function') {
        resumePromise.catch(() => {});
      }
    }
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // ignore
    }
  }

  // 4. Prime the Web Speech API on iOS Safari with an empty utterance
  if ('speechSynthesis' in window) {
    try {
      const empty = new SpeechSynthesisUtterance('');
      empty.volume = 0;
      window.speechSynthesis.speak(empty);
    } catch {
      // ignore
    }
  }

  isAudioUnlocked = true;
}

/**
 * Sets up global one-time interaction listeners to unlock audio on mobile devices (iOS/iPad/Android).
 */
export function setupAudioUnlockListeners(): void {
  if (typeof window === 'undefined' || unlockListenersAttached) return;
  unlockListenersAttached = true;

  const events = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'];
  const handler = () => {
    unlockAudio();
    if (isAudioUnlocked) {
      events.forEach((evt) => {
        window.removeEventListener(evt, handler, true);
        document.removeEventListener(evt, handler, true);
      });
    }
  };

  events.forEach((evt) => {
    window.addEventListener(evt, handler, { capture: true, passive: true });
    document.addEventListener(evt, handler, { capture: true, passive: true });
  });

  // Automatically fetch custom audio manifest if available
  if (typeof fetch === 'function') {
    fetch('/audio/words/manifest.json')
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (Array.isArray(list)) {
          registerCustomWordAudio(list);
        }
      })
      .catch(() => {});
  }
}

export function resetAudioContextForTesting(): void {
  sharedAudioCtx = null;
  memoryMuted = false;
  isAudioUnlocked = false;
  unlockListenersAttached = false;
  manifestLoaded = false;
  customAudioWords = new Set<string>();
  activeUtterance = null;
  activeAudio = null;
  activeLetterAudio = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(AUDIO_MUTED_KEY);
    } catch {
      // ignore
    }
  }
}

export function playTone(
  freq: number,
  type: OscillatorWaveType,
  duration = 0.1,
  vol = 0.1
): void {
  if (getAudioMuted()) return;

  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  const executeTone = () => {
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const startTime = audioCtx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // ignore
    }
  };

  if (audioCtx.state === 'suspended') {
    const resumePromise = audioCtx.resume();
    if (resumePromise && typeof resumePromise.then === 'function') {
      resumePromise.then(executeTone).catch(() => {});
    } else {
      executeTone();
    }
  } else {
    executeTone();
  }
}

export function playGradeSelectSound(): void {
  playTone(400, 'sine', 0.1, 0.1);
}

export function playStartGameSound(): void {
  playTone(600, 'triangle', 0.2, 0.1);
}

export function playContinueGameSound(): void {
  playTone(500, 'square', 0.2, 0.1);
}

export function playExitHomeSound(): void {
  playTone(300, 'sawtooth', 0.2, 0.1);
}

export function playTypeLetterSound(slotIndex: number): void {
  playTone(400 + slotIndex * 50, 'sine', 0.1, 0.1);
}

export function playRemoveLetterSound(): void {
  playTone(300, 'triangle', 0.1, 0.1);
}

export function playUseHintSound(): void {
  playTone(800, 'sine', 0.15, 0.1);
}

export function playWordWrongSound(): void {
  playTone(200, 'sawtooth', 0.3, 0.2);
}

export function playWordCorrectFanfare(): ReturnType<typeof setTimeout>[] {
  if (getAudioMuted()) return [];

  playTone(523.25, 'triangle', 0.1, 0.2); // C5
  const t1 = setTimeout(() => playTone(659.25, 'triangle', 0.1, 0.2), 100); // E5
  const t2 = setTimeout(() => playTone(783.99, 'triangle', 0.2, 0.2), 200); // G5
  return [t1, t2];
}

export function speakWord(word: string): void {
  if (!word || getAudioMuted()) return;
  const g = (typeof window !== 'undefined' ? window : globalThis) as unknown as {
    speechSynthesis?: SpeechSynthesis;
    SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
  };
  const synth = g.speechSynthesis;
  const UtteranceCtor = g.SpeechSynthesisUtterance;
  if (!synth || !UtteranceCtor) return;

  // On iOS Safari, wake up the audio context if suspended
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    const p = sharedAudioCtx.resume();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {});
    }
  }

  if (typeof synth.cancel === 'function') {
    try {
      synth.cancel();
    } catch {
      // ignore
    }
  }

  try {
    const utterance = new UtteranceCtor(word.toLowerCase());
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.2;

    const voices = synth.getVoices ? synth.getVoices() : [];
    const chosenVoice =
      voices.find((v) => v.lang.startsWith('en-') && v.name.includes('Google')) ||
      voices.find((v) => v.lang === 'en-US' && !v.name.toLowerCase().includes('compact')) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en'));

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    // Store in activeUtterance and window to prevent WebKit premature GC bug
    activeUtterance = utterance;
    if (typeof window !== 'undefined') {
      (window as unknown as { __t2s_utterance?: SpeechSynthesisUtterance | null }).__t2s_utterance = utterance;
    }

    utterance.onend = () => {
      if (activeUtterance === utterance) activeUtterance = null;
    };
    utterance.onerror = () => {
      if (activeUtterance === utterance) activeUtterance = null;
    };

    synth.speak(utterance);
  } catch {
    // ignore
  }
}

export function stopWordAudio(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  if (activeLetterAudio) {
    try {
      activeLetterAudio.pause();
      activeLetterAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeLetterAudio = null;
  }
  activeUtterance = null;
  const g = (typeof window !== 'undefined' ? window : globalThis) as unknown as {
    speechSynthesis?: SpeechSynthesis;
  };
  if (g.speechSynthesis && typeof g.speechSynthesis.cancel === 'function') {
    try {
      g.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function speakLetter(letter: string): void {
  const clean = letter.trim().toLowerCase();
  if (!/^[a-z]$/.test(clean) || getAudioMuted()) return;
  speakWord(clean);
}

export function playLetterAudio(letter: string): void {
  if (!letter || getAudioMuted()) return;
  const clean = letter.trim().toLowerCase();
  if (!/^[a-z]$/.test(clean)) return;

  if (activeLetterAudio) {
    try {
      activeLetterAudio.pause();
      activeLetterAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeLetterAudio = null;
  }

  const g = (typeof window !== 'undefined' ? window : globalThis) as unknown as {
    Audio?: typeof Audio;
  };

  const audioSrc = `/audio/letters/${clean}.mp3`;

  if (g.Audio) {
    try {
      const audio = new g.Audio(audioSrc);
      activeLetterAudio = audio;

      let fallbackTriggered = false;
      const triggerFallback = () => {
        if (!fallbackTriggered) {
          fallbackTriggered = true;
          if (activeLetterAudio === audio) {
            activeLetterAudio = null;
          }
          speakLetter(clean);
        }
      };

      audio.addEventListener('error', triggerFallback, { once: true });

      const playPromise = audio.play();
      if (playPromise !== undefined && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          triggerFallback();
        });
      }
      return;
    } catch {
      // Fall through to speakLetter on instantiation failure
    }
  }

  speakLetter(clean);
}

export function playWordAudio(word: string, customAudioUrl?: string): void {
  if (!word || getAudioMuted()) return;
  stopWordAudio();

  const g = (typeof window !== 'undefined' ? window : globalThis) as unknown as {
    Audio?: typeof Audio;
  };

  // If manifest is loaded and we know this word has no custom audio, directly speak!
  // This skips the 404 network request and preserves user activation on iOS Safari.
  const hasCustom = hasCustomAudio(word, customAudioUrl);
  if (manifestLoaded && !hasCustom) {
    speakWord(word);
    return;
  }

  const audioSrc = customAudioUrl || `/audio/words/${word.toLowerCase()}.mp3`;

  if (g.Audio) {
    try {
      const audio = new g.Audio(audioSrc);
      activeAudio = audio;

      let fallbackTriggered = false;
      const triggerFallback = () => {
        if (!fallbackTriggered) {
          fallbackTriggered = true;
          if (activeAudio === audio) {
            activeAudio = null;
          }
          speakWord(word);
        }
      };

      audio.addEventListener('error', triggerFallback, { once: true });

      const playPromise = audio.play();
      if (playPromise !== undefined && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          triggerFallback();
        });
      }
      return;
    } catch {
      // Fall through to speakWord on instantiation failure
    }
  }

  speakWord(word);
}

export function initSpeechVoices(): void {
  setupAudioUnlockListeners();
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}
