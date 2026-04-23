let ctx = null;

function getCtx() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume();
}

function beep({ freq = 880, duration = 0.12, type = 'sine', gain = 0.18 } = {}) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.01);
  g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
}

export const tones = {
  countdown: () => beep({ freq: 880, duration: 0.1 }),
  transition: () => beep({ freq: 660, duration: 0.35, gain: 0.22 }),
  startSkip: () => beep({ freq: 1200, duration: 0.25, gain: 0.22 }),
  startRest: () => beep({ freq: 440, duration: 0.3, gain: 0.22 }),
  // Rest-between-sets cues (distinct from phase-transition tones):
  restCountdown: () => beep({ freq: 660, duration: 0.08, gain: 0.2 }),
  restEnd: () => beep({ freq: 520, duration: 0.45, gain: 0.25 }),
  complete: () => {
    beep({ freq: 880, duration: 0.18 });
    setTimeout(() => beep({ freq: 1320, duration: 0.35, gain: 0.25 }), 180);
  },
};
