type OscillatorWaveType = OscillatorType;

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
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

export function resetAudioContextForTesting(): void {
  sharedAudioCtx = null;
}

export function playTone(
  freq: number,
  type: OscillatorWaveType,
  duration = 0.1,
  vol = 0.1
): void {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
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
  playTone(523.25, 'triangle', 0.1, 0.2); // C5
  const t1 = setTimeout(() => playTone(659.25, 'triangle', 0.1, 0.2), 100); // E5
  const t2 = setTimeout(() => playTone(783.99, 'triangle', 0.2, 0.2), 200); // G5
  return [t1, t2];
}

export function speakWord(word: string): void {
  if (!word) return;
  const g = (typeof window !== 'undefined' ? window : globalThis) as unknown as {
    speechSynthesis?: SpeechSynthesis;
    SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
  };

  const synth = g.speechSynthesis;
  const UtteranceCtor = g.SpeechSynthesisUtterance;
  if (!synth || !UtteranceCtor) return;

  synth.cancel();

  const utterance = new UtteranceCtor(word.toLowerCase());
  utterance.rate = 0.85;
  utterance.pitch = 1.2;

  const voices = synth.getVoices ? synth.getVoices() : [];
  const enVoice = voices.find((v) => v.lang.startsWith('en-') && v.name.includes('Google'));
  if (enVoice) {
    utterance.voice = enVoice;
  }

  synth.speak(utterance);
}

export function initSpeechVoices(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

