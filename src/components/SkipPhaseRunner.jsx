import { useEffect, useState } from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';
import ProgressRing from './ProgressRing.jsx';
import Button from './Button.jsx';
import { formatMMSS } from '../lib/time.js';
import { useWorkoutEngine } from '../hooks/useWorkoutEngine.js';
import { useWakeLock } from '../hooks/useWakeLock.js';

/**
 * Runs a "skip-style" workout block (timed/reps phases in rounds) using the
 * existing skip engine. Used both for:
 *   - Full skip workouts (Endurance / HIIT / Conditioning)
 *   - PPL finisher and circuit blocks
 *
 * Callbacks:
 *   onComplete({ totalRounds, completedRounds, elapsedSeconds })
 *   onExitRequest() — parent controls any exit confirmation UI
 */
export default function SkipPhaseRunner({
  workout,              // { phases, rounds, name }
  title,                // override title for header
  audioEnabled,
  hapticsEnabled,
  autoStart = true,
  showRoundCounter = true,
  showWorkoutTitle = true,
  onComplete,
  completeButtonLabel = 'Continue',
}) {
  const engine = useWorkoutEngine(workout, { audioEnabled, hapticsEnabled });
  const [completedFired, setCompletedFired] = useState(false);

  useWakeLock(engine.isCountdown || engine.isRunning || engine.isPaused);

  useEffect(() => {
    if (autoStart && engine.status === 'idle') engine.start();
  }, [autoStart, engine.status]);

  useEffect(() => {
    if (engine.isComplete && !completedFired) {
      setCompletedFired(true);
      onComplete?.({
        totalRounds: engine.totalRounds,
        completedRounds: engine.totalRounds,
        elapsedSeconds: Math.round(engine.elapsedSeconds),
      });
    }
  }, [engine.isComplete, completedFired, engine.totalRounds, engine.elapsedSeconds, onComplete]);

  const phase = engine.currentPhase;
  const ringProgress =
    engine.isCountdown
      ? 1 - engine.introRemaining / 5
      : phase?.type === 'timed' && phase.duration
      ? 1 - engine.secondsRemaining / phase.duration
      : 0;

  const nextLabel = engine.nextPhase
    ? engine.nextPhase.type === 'timed'
      ? `${engine.nextPhase.label} ${formatMMSS(engine.nextPhase.duration)}`
      : `${engine.nextPhase.label} ×${engine.nextPhase.reps}`
    : 'Done';

  return (
    <div className="flex-1 flex flex-col">
      {showRoundCounter ? (
        <div className="px-4 pt-2 text-sm font-mono text-neutral-400 text-right">
          Round {engine.roundNumber} of {engine.totalRounds}
        </div>
      ) : null}

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        {engine.isCountdown ? (
          <>
            <div className="text-sm uppercase tracking-widest text-neutral-500 mb-4">
              Get ready
            </div>
            <ProgressRing progress={ringProgress} size={300}>
              <div className="text-[9rem] leading-none font-mono font-bold text-green-500">
                {Math.max(1, Math.ceil(engine.introRemaining))}
              </div>
            </ProgressRing>
            {showWorkoutTitle ? (
              <div className="mt-8 text-sm text-neutral-500">
                Starting: {title || workout.name}
              </div>
            ) : null}
          </>
        ) : engine.isComplete ? (
          <div className="text-center">
            <div className="text-3xl font-semibold text-neutral-100">Done!</div>
            <div className="mt-2 text-sm text-neutral-400">
              {title || workout.name} complete
            </div>
            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={() =>
                  onComplete?.({
                    totalRounds: engine.totalRounds,
                    completedRounds: engine.totalRounds,
                    elapsedSeconds: Math.round(engine.elapsedSeconds),
                  })
                }
              >
                {completeButtonLabel}
              </Button>
            </div>
          </div>
        ) : phase?.type === 'timed' ? (
          <>
            <div
              className={[
                'text-2xl font-bold uppercase tracking-widest mb-4',
                phase.intensity === 'rest' ? 'text-neutral-300' : 'text-green-500',
              ].join(' ')}
            >
              {phase.label}
            </div>
            <ProgressRing progress={ringProgress} size={300}>
              <div className="font-mono font-bold text-neutral-100 text-[6.5rem] leading-none">
                {formatMMSS(engine.secondsRemaining)}
              </div>
            </ProgressRing>
            <div className="mt-6 text-sm text-neutral-500">Next: {nextLabel}</div>
          </>
        ) : phase?.type === 'reps' ? (
          <>
            <div className="text-2xl font-bold uppercase tracking-widest mb-4 text-green-500">
              {phase.label}
            </div>
            <div className="text-[7rem] leading-none font-mono font-bold text-neutral-100">
              ×{phase.reps}
            </div>
            <div className="mt-6 text-sm text-neutral-500">Next: {nextLabel}</div>
            <div className="mt-8">
              <Button
                size="lg"
                variant="primary"
                onClick={engine.completeRepPhase}
                className="w-56"
              >
                Done
              </Button>
            </div>
          </>
        ) : null}
      </main>

      <footer className="px-4 pb-6 flex flex-col items-center gap-3">
        {!engine.isCountdown && !engine.isComplete && phase?.type === 'timed' ? (
          <div className="flex gap-3 w-full max-w-sm">
            {engine.isPaused ? (
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={engine.resume}
              >
                <Play size={20} className="mr-2" /> Resume
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={engine.pause}
              >
                <Pause size={20} className="mr-2" /> Pause
              </Button>
            )}
          </div>
        ) : null}
        {!engine.isCountdown && !engine.isComplete ? (
          <button
            onClick={engine.skipPhase}
            className="text-xs text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1 min-h-[40px] px-3"
          >
            <SkipForward size={14} /> Skip phase
          </button>
        ) : null}
      </footer>
    </div>
  );
}
