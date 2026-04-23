import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import SkipPhaseRunner from '../components/SkipPhaseRunner.jsx';
import Button from '../components/Button.jsx';
import { getWorkout } from '../lib/workouts.js';
import { getLevel, getSettings, saveSession } from '../lib/storage.js';

export default function SkipWorkoutFlow({ type }) {
  const navigate = useNavigate();
  const [level] = useState(() => getLevel(type));
  const workout = useMemo(() => getWorkout(type, level), [type, level]);
  const [settings] = useState(() => getSettings());
  const [confirmExit, setConfirmExit] = useState(false);
  const [completed, setCompleted] = useState(false);

  function handleComplete({ totalRounds, elapsedSeconds }) {
    if (completed) return;
    setCompleted(true);
    const now = new Date();
    const draft = {
      program: 'skip',
      date: now.toISOString().slice(0, 10),
      startedAt: now.toISOString(),
      type,
      level,
      plannedRounds: totalRounds,
      completedRounds: totalRounds,
      durationSeconds: elapsedSeconds,
      skipped: false,
    };
    navigate('/log', { replace: true, state: { draft } });
  }

  function exitWithoutSaving() {
    navigate('/', { replace: true });
  }

  function saveAsSkipped() {
    const now = new Date();
    saveSession({
      program: 'skip',
      date: now.toISOString().slice(0, 10),
      startedAt: now.toISOString(),
      type,
      level,
      plannedRounds: workout.rounds,
      completedRounds: 0,
      durationSeconds: 0,
      rpe: 0,
      notes: '',
      skipped: true,
    });
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-full flex flex-col pt-safe pb-safe">
      <header className="flex items-center justify-between px-4 pt-3">
        <button
          onClick={() => setConfirmExit(true)}
          aria-label="Exit workout"
          className="w-11 h-11 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <X size={22} />
        </button>
        <div className="text-xs text-neutral-500 font-mono">
          {workout.name} · L{level}
        </div>
      </header>

      <SkipPhaseRunner
        workout={workout}
        title={workout.name}
        audioEnabled={settings.audioEnabled}
        hapticsEnabled={settings.hapticsEnabled}
        onComplete={handleComplete}
        completeButtonLabel="Log session"
      />

      {confirmExit ? (
        <ExitConfirm
          onKeep={() => setConfirmExit(false)}
          onSaveSkipped={saveAsSkipped}
          onExit={exitWithoutSaving}
        />
      ) : null}
    </div>
  );
}

function ExitConfirm({ onKeep, onSaveSkipped, onExit }) {
  return (
    <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
        <h3 className="text-lg font-semibold text-neutral-100">Exit workout?</h3>
        <p className="mt-1 text-sm text-neutral-400">
          You can log this as a skipped session or exit without saving.
        </p>
        <div className="mt-4 space-y-2">
          <Button variant="secondary" size="md" className="w-full" onClick={onKeep}>
            Keep going
          </Button>
          <Button variant="secondary" size="md" className="w-full" onClick={onSaveSkipped}>
            Save as skipped
          </Button>
          <Button variant="danger" size="md" className="w-full" onClick={onExit}>
            Exit without saving
          </Button>
        </div>
      </div>
    </div>
  );
}
