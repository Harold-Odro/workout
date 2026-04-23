import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { X, Pause, Play, SkipForward } from 'lucide-react';
import ProgressRing from '../components/ProgressRing.jsx';
import Button from '../components/Button.jsx';
import { getWorkout } from '../lib/workouts.js';
import { formatMMSS } from '../lib/time.js';
import { getLevel, getSettings, saveSession } from '../lib/storage.js';
import { useWorkoutEngine } from '../hooks/useWorkoutEngine.js';
import { useWakeLock } from '../hooks/useWakeLock.js';

export default function Workout() {
  const location = useLocation();
  const navigate = useNavigate();
  const type = location.state?.type;

  if (!type) return <Navigate to="/" replace />;

  const [level] = useState(() => getLevel(type));
  const workout = useMemo(() => getWorkout(type, level), [type, level]);
  const [settings] = useState(() => getSettings());
  const [confirmExit, setConfirmExit] = useState(false);

  const engine = useWorkoutEngine(workout, {
    audioEnabled: settings.audioEnabled,
    hapticsEnabled: settings.hapticsEnabled,
  });

  useWakeLock(engine.isCountdown || engine.isRunning || engine.isPaused);

  useEffect(() => {
    if (engine.status === 'idle') engine.start();
  }, [engine.status]);

  useEffect(() => {
    if (!engine.isComplete) return;
    const now = new Date();
    const draft = {
      date: now.toISOString().slice(0, 10),
      startedAt: now.toISOString(),
      type,
      level,
      plannedRounds: engine.totalRounds,
      completedRounds: engine.totalRounds,
      durationSeconds: Math.round(engine.elapsedSeconds),
      skipped: false,
    };
    navigate('/log', { replace: true, state: { draft } });
  }, [engine.isComplete]);

  function handleExit() {
    if (engine.isComplete) {
      navigate('/', { replace: true });
      return;
    }
    setConfirmExit(true);
  }

  function exitWithoutSaving() {
    engine.exit();
    navigate('/', { replace: true });
  }

  function saveAsSkipped() {
    engine.exit();
    const now = new Date();
    saveSession({
      date: now.toISOString().slice(0, 10),
      startedAt: now.toISOString(),
      type,
      level,
      plannedRounds: engine.totalRounds,
      completedRounds: engine.completedRounds,
      durationSeconds: Math.round(engine.elapsedSeconds),
      rpe: 0,
      notes: '',
      skipped: true,
    });
    navigate('/', { replace: true });
  }

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
    : 'Finish';

  return (
    <div className="min-h-full flex flex-col pt-safe pb-safe">
      <header className="flex items-center justify-between px-4 pt-3">
        <button
          onClick={handleExit}
          aria-label="Exit workout"
          className="w-11 h-11 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <X size={22} />
        </button>
        <div className="text-sm font-mono text-neutral-400">
          Round {engine.roundNumber} of {engine.totalRounds}
        </div>
      </header>

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
            <div className="mt-8 text-sm text-neutral-500">
              Starting: {workout.name} · L{level}
            </div>
          </>
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
            <div className="text-[8rem] leading-none font-mono font-bold text-neutral-100">
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
        {!engine.isCountdown && phase?.type === 'timed' ? (
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
        {!engine.isCountdown ? (
          <button
            onClick={engine.skipPhase}
            className="text-xs text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1 min-h-[40px] px-3"
          >
            <SkipForward size={14} /> Skip phase
          </button>
        ) : null}
      </footer>

      {confirmExit ? (
        <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h3 className="text-lg font-semibold text-neutral-100">Exit workout?</h3>
            <p className="mt-1 text-sm text-neutral-400">
              You can log this as a skipped session or exit without saving.
            </p>
            <div className="mt-4 space-y-2">
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => setConfirmExit(false)}
              >
                Keep going
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={saveAsSkipped}
              >
                Save as skipped
              </Button>
              <Button
                variant="danger"
                size="md"
                className="w-full"
                onClick={exitWithoutSaving}
              >
                Exit without saving
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
