import confetti from 'canvas-confetti';

const CONFETTI_COLORS = ['#facc15', '#4ade80', '#22d3ee', '#f472b6', '#a78bfa'];

let activeWordConfettiInterval: ReturnType<typeof setInterval> | null = null;
let activeLevelConfettiInterval: ReturnType<typeof setInterval> | null = null;

export function fireSingleWordBurst(): void {
  confetti({
    particleCount: 20,
    spread: 360,
    startVelocity: 15,
    gravity: 0.4,
    ticks: 300,
    origin: { x: Math.random(), y: Math.random() - 0.2 },
    colors: CONFETTI_COLORS,
    zIndex: 9999,
  });
}

export function startWordConfetti(durationMs = 1000): ReturnType<typeof setInterval> {
  if (activeWordConfettiInterval) {
    clearInterval(activeWordConfettiInterval);
    activeWordConfettiInterval = null;
  }

  const end = Date.now() + durationMs;
  fireSingleWordBurst();

  activeWordConfettiInterval = setInterval(() => {
    if (Date.now() > end) {
      if (activeWordConfettiInterval) {
        clearInterval(activeWordConfettiInterval);
        activeWordConfettiInterval = null;
      }
      return;
    }
    fireSingleWordBurst();
  }, 250);

  return activeWordConfettiInterval;
}

export function fireSingleLevelBurst(): void {
  // Left edge cannon
  confetti({
    particleCount: 15,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.5 },
    colors: CONFETTI_COLORS,
    zIndex: 9999,
  });
  // Right edge cannon
  confetti({
    particleCount: 15,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.5 },
    colors: CONFETTI_COLORS,
    zIndex: 9999,
  });
}

export function startLevelConfetti(durationMs = 5000): ReturnType<typeof setInterval> {
  resetConfetti();

  const animationEnd = Date.now() + durationMs;
  fireSingleLevelBurst();

  activeLevelConfettiInterval = setInterval(() => {
    if (Date.now() > animationEnd) {
      if (activeLevelConfettiInterval) {
        clearInterval(activeLevelConfettiInterval);
        activeLevelConfettiInterval = null;
      }
      return;
    }
    fireSingleLevelBurst();
  }, 250);

  return activeLevelConfettiInterval;
}

export function resetConfetti(): void {
  if (activeWordConfettiInterval) {
    clearInterval(activeWordConfettiInterval);
    activeWordConfettiInterval = null;
  }
  if (activeLevelConfettiInterval) {
    clearInterval(activeLevelConfettiInterval);
    activeLevelConfettiInterval = null;
  }
  if (typeof confetti === 'function' && typeof confetti.reset === 'function') {
    confetti.reset();
  }
}

