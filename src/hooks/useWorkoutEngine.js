import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tones, unlockAudio } from '../lib/audio.js';

// States:
//   idle       → not started
//   countdown  → 5s "get ready" before first phase
//   running    → phase in progress (timed or reps)
//   paused     → user paused a timed phase
//   complete   → all phases done

const INTRO_SECONDS = 5;
const TICK_MS = 100;

function vibrate(ms, enabled) {
  if (!enabled) return;
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

function playPhaseStartTone(phase) {
  if (!phase) return;
  if (phase.type !== 'timed') {
    tones.transition();
    return;
  }
  if (phase.intensity === 'skip') tones.startSkip();
  else if (phase.intensity === 'rest') tones.startRest();
  else tones.transition();
}

export function useWorkoutEngine(workout, { audioEnabled = true, hapticsEnabled = true } = {}) {
  const phases = workout?.phases || [];
  const totalPhases = phases.length;

  const [status, setStatus] = useState('idle');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [introRemaining, setIntroRemaining] = useState(INTRO_SECONDS);
  const [secondsRemaining, setSecondsRemaining] = useState(
    phases[0]?.type === 'timed' ? phases[0].duration : 0
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedRounds, setCompletedRounds] = useState(0);

  // Timing refs — we use performance.now() so we don't drift when backgrounded.
  const phaseEndRef = useRef(0);         // absolute ms when current timed phase ends
  const phaseRemainingRef = useRef(0);   // while paused
  const introEndRef = useRef(0);
  const workoutStartRef = useRef(0);
  const elapsedBaselineRef = useRef(0);  // elapsed-at-pause so resume doesn't lose time
  const pausedAtRef = useRef(0);
  const countdownBeepRef = useRef({ 3: false, 2: false, 1: false });
  const tickRef = useRef(null);

  const currentPhase = phases[phaseIndex] || null;

  const totalRounds = useMemo(() => {
    let max = 0;
    for (const p of phases) if (p.roundIndex > max) max = p.roundIndex;
    return max + 1;
  }, [phases]);

  const roundNumber = currentPhase ? currentPhase.roundIndex + 1 : 1;

  const nextPhase = phases[phaseIndex + 1] || null;

  function clearTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  const advanceTo = useCallback((nextIdx) => {
    if (nextIdx >= totalPhases) {
      clearTick();
      setStatus('complete');
      setSecondsRemaining(0);
      // Final elapsed snapshot
      if (workoutStartRef.current) {
        setElapsedSeconds((performance.now() - workoutStartRef.current) / 1000);
      }
      if (audioEnabled) tones.complete();
      vibrate(500, hapticsEnabled);
      return;
    }
    const next = phases[nextIdx];
    setPhaseIndex(nextIdx);
    countdownBeepRef.current = { 3: false, 2: false, 1: false };
    // A "round" is considered complete when we leave the final phase of that round.
    const prev = phases[nextIdx - 1];
    if (prev && (!next || next.roundIndex !== prev.roundIndex)) {
      setCompletedRounds(prev.roundIndex + 1);
    }
    if (next.type === 'timed') {
      phaseEndRef.current = performance.now() + next.duration * 1000;
      setSecondsRemaining(next.duration);
    } else {
      setSecondsRemaining(0);
    }
    if (audioEnabled) playPhaseStartTone(next);
    vibrate(150, hapticsEnabled);
  }, [phases, totalPhases, audioEnabled, hapticsEnabled]);

  // Tick loop — handles intro countdown and timed phases.
  useEffect(() => {
    if (status !== 'countdown' && status !== 'running') {
      clearTick();
      return;
    }
    tickRef.current = setInterval(() => {
      const now = performance.now();

      // Update total elapsed
      if (workoutStartRef.current && status === 'running') {
        setElapsedSeconds((now - workoutStartRef.current) / 1000);
      }

      if (status === 'countdown') {
        const remainMs = introEndRef.current - now;
        const remain = Math.max(0, remainMs / 1000);
        setIntroRemaining(remain);
        // Beep at each integer second boundary (5..1)
        const whole = Math.ceil(remain);
        if (whole >= 1 && whole <= 3 && !countdownBeepRef.current[whole]) {
          countdownBeepRef.current[whole] = true;
          if (audioEnabled) tones.countdown();
        }
        if (remainMs <= 0) {
          workoutStartRef.current = performance.now();
          setElapsedSeconds(0);
          setStatus('running');
          // Kick off phase 0
          const first = phases[0];
          if (first) {
            if (first.type === 'timed') {
              phaseEndRef.current = performance.now() + first.duration * 1000;
              setSecondsRemaining(first.duration);
            }
            countdownBeepRef.current = { 3: false, 2: false, 1: false };
            if (audioEnabled) playPhaseStartTone(first);
            vibrate(200, hapticsEnabled);
          }
        }
        return;
      }

      // running
      if (!currentPhase) return;
      if (currentPhase.type !== 'timed') return;

      const remainMs = phaseEndRef.current - now;
      const remain = Math.max(0, remainMs / 1000);
      setSecondsRemaining(remain);

      // Countdown beeps at 3/2/1
      const whole = Math.ceil(remain);
      if (whole >= 1 && whole <= 3 && !countdownBeepRef.current[whole]) {
        countdownBeepRef.current[whole] = true;
        if (audioEnabled) tones.countdown();
      }

      if (remainMs <= 0) {
        advanceTo(phaseIndex + 1);
      }
    }, TICK_MS);
    return clearTick;
  }, [status, phaseIndex, currentPhase, advanceTo, phases, audioEnabled, hapticsEnabled]);

  const start = useCallback(() => {
    if (status !== 'idle') return;
    unlockAudio();
    setStatus('countdown');
    setIntroRemaining(INTRO_SECONDS);
    introEndRef.current = performance.now() + INTRO_SECONDS * 1000;
    countdownBeepRef.current = { 3: false, 2: false, 1: false };
  }, [status]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    if (currentPhase?.type === 'timed') {
      phaseRemainingRef.current = Math.max(0, phaseEndRef.current - performance.now());
    }
    pausedAtRef.current = performance.now();
    elapsedBaselineRef.current = (performance.now() - workoutStartRef.current) / 1000;
    setStatus('paused');
  }, [status, currentPhase]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    if (currentPhase?.type === 'timed') {
      phaseEndRef.current = performance.now() + phaseRemainingRef.current;
    }
    // Shift workoutStart forward by the pause duration so elapsed stays coherent.
    const pausedFor = performance.now() - pausedAtRef.current;
    workoutStartRef.current += pausedFor;
    setStatus('running');
  }, [status, currentPhase]);

  const skipPhase = useCallback(() => {
    if (status !== 'running' && status !== 'paused') return;
    if (status === 'paused') {
      // re-sync workoutStart as if resumed
      const pausedFor = performance.now() - pausedAtRef.current;
      workoutStartRef.current += pausedFor;
      setStatus('running');
    }
    advanceTo(phaseIndex + 1);
  }, [status, phaseIndex, advanceTo]);

  // For rep phases — user taps "Done".
  const completeRepPhase = useCallback(() => {
    if (status !== 'running') return;
    if (currentPhase?.type !== 'reps') return;
    advanceTo(phaseIndex + 1);
  }, [status, currentPhase, phaseIndex, advanceTo]);

  const exit = useCallback(() => {
    clearTick();
    setStatus('idle');
  }, []);

  return {
    status,
    currentPhase,
    currentPhaseIndex: phaseIndex,
    totalPhases,
    nextPhase,
    secondsRemaining,
    introRemaining,
    elapsedSeconds,
    roundNumber,
    totalRounds,
    completedRounds,
    isRunning: status === 'running',
    isPaused: status === 'paused',
    isComplete: status === 'complete',
    isCountdown: status === 'countdown',
    start,
    pause,
    resume,
    skipPhase,
    completeRepPhase,
    exit,
  };
}
