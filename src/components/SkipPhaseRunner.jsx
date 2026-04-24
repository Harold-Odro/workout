import { useEffect, useState } from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';
import ProgressRing from './ProgressRing.jsx';
import Button from './Button.jsx';
import { formatMMSS } from '../lib/time.js';
import { useWorkoutEngine } from '../hooks/useWorkoutEngine.js';
import { useWakeLock } from '../hooks/useWakeLock.js';

export default function SkipPhaseRunner({
  workout,
  title,
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
        <div className="px-6 pt-3 flex items-center gap-3 label-md text-ink-faint justify-end">
          <span>Round</span>
          <span className="font-mono tabular text-crimson">
            {String(engine.roundNumber).padStart(2, '0')}&nbsp;/&nbsp;{String(engine.totalRounds).padStart(2, '0')}
          </span>
        </div>
      ) : null}

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {engine.isCountdown ? (
          <>
            <div className="label-md text-crimson tracking-[0.32em] mb-6">
              ◆&nbsp;&nbsp;Get ready
            </div>
            <ProgressRing progress={ringProgress} size={300}>
              <div className="text-[9rem] leading-none font-serif font-light text-crimson tabular">
                {Math.max(1, Math.ceil(engine.introRemaining))}
              </div>
            </ProgressRing>
            {showWorkoutTitle ? (
              <div className="mt-10 font-serif italic text-ink-dim text-lg">
                {title || workout.name}
              </div>
            ) : null}
          </>
        ) : engine.isComplete ? (
          <div className="text-center">
            <div className="label-md text-crimson tracking-[0.32em] mb-4">◆&nbsp;&nbsp;Complete</div>
            <div className="font-serif text-5xl font-light text-ink leading-tight">Done.</div>
            <div className="mt-3 font-serif italic text-ink-dim text-base">
              {title || workout.name}
            </div>
            <div className="mt-10">
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
                'label-md mb-5 tracking-[0.32em]',
                phase.intensity === 'rest' ? 'text-ink-dim' : 'text-crimson',
              ].join(' ')}
            >
              {phase.label}
            </div>
            <ProgressRing progress={ringProgress} size={300}>
              <div className="font-serif font-light text-ink text-[6.5rem] leading-none tabular">
                {formatMMSS(engine.secondsRemaining)}
              </div>
            </ProgressRing>
            <div className="mt-7 label-md text-ink-faint">
              Next&nbsp;·&nbsp;<span className="text-ink-dim">{nextLabel}</span>
            </div>
          </>
        ) : phase?.type === 'reps' ? (
          <>
            <div className="label-md text-crimson tracking-[0.32em] mb-5">
              {phase.label}
            </div>
            <div className="text-[7rem] leading-none font-serif font-light text-ink tabular">
              ×{phase.reps}
            </div>
            <div className="mt-7 label-md text-ink-faint">
              Next&nbsp;·&nbsp;<span className="text-ink-dim">{nextLabel}</span>
            </div>
            <div className="mt-10">
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

      <footer className="px-6 pb-7 flex flex-col items-center gap-4">
        {!engine.isCountdown && !engine.isComplete && phase?.type === 'timed' ? (
          <div className="flex gap-3 w-full max-w-sm">
            {engine.isPaused ? (
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={engine.resume}
              >
                <Play size={18} strokeWidth={1.6} className="mr-2" /> Resume
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={engine.pause}
              >
                <Pause size={18} strokeWidth={1.6} className="mr-2" /> Pause
              </Button>
            )}
          </div>
        ) : null}
        {!engine.isCountdown && !engine.isComplete ? (
          <button
            onClick={engine.skipPhase}
            className="label-md text-ink-faint hover:text-crimson inline-flex items-center gap-2 min-h-10 px-3 transition-colors"
          >
            <SkipForward size={14} strokeWidth={1.4} /> Skip phase
          </button>
        ) : null}
      </footer>
    </div>
  );
}
