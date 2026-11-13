import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAudioMuted,
  playGradeSelectSound,
  playTone,
  playWordAudio,
  resetAudioContextForTesting,
  setAudioMuted,
  speakWord,
  stopWordAudio,
} from './audio';

describe('audio.ts — Web Audio API Synthesizer & Web Speech API TTS', () => {
  let lastOsc: {
    type: string;
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };
  let lastGain: {
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  };
  let resumeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetAudioContextForTesting();
    resumeSpy = vi.fn();

    class MockAudioContext {
      state = 'suspended';
      currentTime = 1.0;
      destination = {};
      resume = resumeSpy;
      createOscillator() {
        lastOsc = {
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
        return lastOsc;
      }
      createGain() {
        lastGain = {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
        return lastGain;
      }
    }

    Object.defineProperty(globalThis, 'AudioContext', {
      value: MockAudioContext,
      configurable: true,
      writable: true,
    });
  });

  it('resumes suspended AudioContext and ramps oscillator gain down to 0.001', () => {
    playTone(600, 'triangle', 0.2, 0.15);

    expect(resumeSpy).toHaveBeenCalledTimes(1);
    expect(lastOsc.type).toBe('triangle');
    expect(lastOsc.frequency.setValueAtTime).toHaveBeenCalledWith(600, 1.0);
    expect(lastGain.gain.setValueAtTime).toHaveBeenCalledWith(0.15, 1.0);
    expect(lastGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 1.2);
    expect(lastOsc.start).toHaveBeenCalledTimes(1);
    expect(lastOsc.stop).toHaveBeenCalledWith(1.2);

    playGradeSelectSound();
    expect(lastOsc.frequency.setValueAtTime).toHaveBeenCalledWith(400, 1.0);
  });

  it('suppresses audio tones and speech when audio is muted', () => {
    setAudioMuted(true);
    expect(getAudioMuted()).toBe(true);

    playTone(600, 'triangle', 0.2, 0.15);
    expect(resumeSpy).not.toHaveBeenCalled();

    const speakSpy = vi.fn();
    Object.defineProperty(globalThis, 'speechSynthesis', {
      value: { speak: speakSpy, cancel: vi.fn(), getVoices: () => [] },
      configurable: true,
      writable: true,
    });
    speakWord('CAT');
    expect(speakSpy).not.toHaveBeenCalled();

    setAudioMuted(false);
    expect(getAudioMuted()).toBe(false);
  });

  it('cancels active speech and speaks lowercase utterance at rate 0.85, pitch 1.2 with Google English voice', () => {
    const cancelSpy = vi.fn();
    const speakSpy = vi.fn();
    const googleVoice = { lang: 'en-US', name: 'Google US English' } as SpeechSynthesisVoice;

    class MockUtterance {
      text: string;
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    Object.defineProperty(globalThis, 'speechSynthesis', {
      value: {
        cancel: cancelSpy,
        speak: speakSpy,
        getVoices: () => [
          { lang: 'fr-FR', name: 'Google Français' },
          googleVoice,
        ],
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      value: MockUtterance,
      configurable: true,
      writable: true,
    });

    speakWord('ELEPHANT');

    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(speakSpy).toHaveBeenCalledTimes(1);
    const spoken = speakSpy.mock.calls[0][0] as MockUtterance;
    expect(spoken.text).toBe('elephant');
    expect(spoken.rate).toBe(0.85);
    expect(spoken.pitch).toBe(1.2);
    expect(spoken.voice).toBe(googleVoice);
  });

  it('plays custom Audio when available and falls back to speakWord on error', async () => {
    const playSpy = vi.fn().mockRejectedValue(new Error('File not found'));
    const pauseSpy = vi.fn();
    const eventListeners: Record<string, Function[]> = {};

    class MockAudio {
      src: string;
      currentTime = 0;
      play = playSpy;
      pause = pauseSpy;
      constructor(src: string) {
        this.src = src;
      }
      addEventListener(event: string, handler: Function) {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(handler);
      }
    }

    Object.defineProperty(globalThis, 'Audio', {
      value: MockAudio,
      configurable: true,
      writable: true,
    });

    const cancelSpy = vi.fn();
    const speakSpy = vi.fn();
    Object.defineProperty(globalThis, 'speechSynthesis', {
      value: {
        cancel: cancelSpy,
        speak: speakSpy,
        getVoices: () => [],
      },
      configurable: true,
      writable: true,
    });

    playWordAudio('CAT');
    expect(playSpy).toHaveBeenCalled();

    // Trigger error listener fallback
    if (eventListeners['error']) {
      eventListeners['error'].forEach((cb) => cb());
    }

    expect(speakSpy).toHaveBeenCalled();
    stopWordAudio();
  });

  it('unlocks audio context, primes speech synthesis, and sets iOS audioSession to playback', () => {
    const audioSessionObj = { type: 'ambient' };
    Object.defineProperty(globalThis, 'navigator', {
      value: { audioSession: audioSessionObj },
      configurable: true,
      writable: true,
    });

    const speakSpy = vi.fn();
    Object.defineProperty(globalThis, 'speechSynthesis', {
      value: {
        speak: speakSpy,
        cancel: vi.fn(),
        getVoices: () => [],
      },
      configurable: true,
      writable: true,
    });

    class MockUtterance {
      text: string;
      volume = 1;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      value: MockUtterance,
      configurable: true,
      writable: true,
    });

    import('./audio').then(({ unlockAudio }) => {
      unlockAudio();
      expect(audioSessionObj.type).toBe('playback');
      expect(speakSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('skips new Audio network requests and speaks directly when manifest is loaded and word has no custom audio', () => {
    const playSpy = vi.fn();
    class MockAudio {
      src: string;
      play = playSpy;
      constructor(src: string) {
        this.src = src;
      }
      addEventListener() {}
    }
    Object.defineProperty(globalThis, 'Audio', {
      value: MockAudio,
      configurable: true,
      writable: true,
    });

    const speakSpy = vi.fn();
    Object.defineProperty(globalThis, 'speechSynthesis', {
      value: {
        cancel: vi.fn(),
        speak: speakSpy,
        getVoices: () => [],
      },
      configurable: true,
      writable: true,
    });

    import('./audio').then(({ registerCustomWordAudio, playWordAudio }) => {
      // Manifest loaded with only 'dog'
      registerCustomWordAudio(['dog']);

      // 'cat' is not in manifest -> should call speakWord directly without calling new Audio play
      playWordAudio('CAT');
      expect(playSpy).not.toHaveBeenCalled();
      expect(speakSpy).toHaveBeenCalled();
    });
  });
});
