import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  playGradeSelectSound,
  playTone,
  resetAudioContextForTesting,
  speakWord,
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
});

