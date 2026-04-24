import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import ExerciseIntro from '../components/ExerciseIntro.jsx';
import SetLogger from '../components/SetLogger.jsx';
import UnilateralSetLogger from '../components/UnilateralSetLogger.jsx';
import RestTimer from '../components/RestTimer.jsx';
import SkipPhaseRunner from '../components/SkipPhaseRunner.jsx';
import Button from '../components/Button.jsx';
import { PPL_META, getPPLWorkout } from '../lib/workoutsPPL.js';
import {
  getExerciseLevels,
  getPPLSettings,
  getSettings,
  saveSession,
} from '../lib/storage.js';
import { useStrengthEngine } from '../hooks/useStrengthEngine.js';
import { useWakeLock } from '../hooks/useWakeLock.js';

export default function PPLWorkoutFlow({ type }) {
  const navigate = useNavigate();
  const [settings] = useState(() => getSettings());
  const pplSettings = useMemo(() => getPPLSettings(), []);
  const exerciseLevels = useMemo(() => getExerciseLevels(), []);
  const workout = useMemo(
    () => getPPLWorkout(type, { exerciseLevels }),
    [type, exerciseLevels]
  );

  const [confirmExit, setConfirmExit] = useState(false);
  const startedAtRef = useRef(Date.now());
  const routedRef = useRef(false);

  const engine = useStrengthEngine(workout, {
    defaultWeightKg: pplSettings.defaultWeightKg,
  });

  useWakeLock(!engine.isDone);

  function routeToLog() {
    if (routedRef.current) return;
    routedRef.current = true;
    const finisherBlockIds = workout.blocks
      .map((b, idx) => (b.kind === 'finisher' || b.kind === 'circuit' ? idx : null))
      .filter((x) => x !== null);
    const allFinishersDone =
      finisherBlockIds.length === 0
        ? null
        : finisherBlockIds.every((idx) => engine.finisherCompleted[idx]);
    const draft = {
      program: 'ppl',
      date: new Date().toISOString().slice(0, 10),
      startedAt: new Date(startedAtRef.current).toISOString(),
      type,
      durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
      skipped: false,
      exercises: Object.values(engine.logged),
      finisherCompleted: allFinishersDone,
    };
    navigate('/log', { replace: true, state: { draft } });
  }

  useEffect(() => {
    if (engine.isDone) routeToLog();
  }, [engine.isDone]);

  function handleExit() {
    if (engine.isDone) {
      routeToLog();
      return;
    }
    setConfirmExit(true);
  }

  function exitWithoutSaving() {
    navigate('/', { replace: true });
  }

  function saveAsSkipped() {
    saveSession({
      program: 'ppl',
      date: new Date().toISOString().slice(0, 10),
      startedAt: new Date(startedAtRef.current).toISOString(),
      type,
      durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
      rpe: 0,
      notes: '',
      skipped: true,
      exercises: Object.values(engine.logged),
      finisherCompleted: false,
    });
    navigate('/', { replace: true });
  }

  const block = engine.block;
  const exercise = engine.exercise;
  const lastEntry = exercise ? engine.lastEntry(exercise.id) : null;

  const header = (
    <header className="flex items-center justify-between px-5 pt-3">
      <button
        onClick={handleExit}
        aria-label="Exit workout"
        className="w-11 h-11 flex items-center justify-center text-ink-faint hover:text-crimson transition-colors focus:outline-none focus-visible:text-crimson"
      >
        <X size={22} strokeWidth={1.4} />
      </button>
      <div className="font-mono text-[10px] tabular tracking-[0.2em] uppercase text-ink-faint text-right">
        <span className="text-crimson">PPL</span>&nbsp;·&nbsp;{PPL_META[type]?.name}
      </div>
    </header>
  );

  function renderBody() {
    if (engine.page === 'done') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="label-md text-crimson tracking-[0.32em]">◆&nbsp;&nbsp;Complete</div>
          <div className="mt-5 font-serif text-5xl font-light text-ink leading-tight">Done.</div>
          <div className="mt-3 font-serif italic text-ink-dim text-base">
            {PPL_META[type]?.name}
          </div>
        </div>
      );
    }
    if (engine.page === 'intro' && exercise) {
      return (
        <ExerciseIntro
          exercise={exercise}
          lastEntry={lastEntry}
          exerciseIndex={engine.currentStrengthIndex}
          totalExercises={engine.totalStrengthExercises}
          onStart={engine.startExercise}
          onSkip={engine.skipExercise}
        />
      );
    }
    if (engine.page === 'logging' && exercise) {
      const Cmp = exercise.unilateral ? UnilateralSetLogger : SetLogger;
      return (
        <Cmp
          exercise={exercise}
          setIndex={engine.currentSetIndex}
          totalSets={engine.totalSetsForExercise}
          loggedSets={engine.loggedSets}
          lastEntry={lastEntry}
          weightPrefill={engine.weightPrefill(exercise.id)}
          onLog={engine.logSet}
          onEditPrevious={engine.editPrevious}
          onSkipRemaining={engine.skipRemaining}
          onSkipExercise={engine.skipExercise}
          onEndWorkout={engine.endWorkout}
        />
      );
    }
    if (engine.page === 'resting' && exercise) {
      const justSet = engine.loggedSets[engine.currentSetIndex];
      // Next-set preview: prefer what the user just did (same weight, target reps
      // within the low end of range). For unilateral, pick the heavier side.
      let nextPreview = null;
      if (justSet && (justSet.left || justSet.right)) {
        const l = Number(justSet.left?.weightKg) || 0;
        const r = Number(justSet.right?.weightKg) || 0;
        const side = l >= r ? justSet.left : justSet.right;
        nextPreview = {
          reps: side?.reps ?? (exercise.targetReps?.[0] ?? 0),
          weightKg: side?.weightKg ?? engine.weightPrefill(exercise.id),
        };
      } else if (justSet) {
        nextPreview = {
          reps: justSet.reps ?? (exercise.targetReps?.[0] ?? 0),
          weightKg: justSet.weightKg ?? engine.weightPrefill(exercise.id),
        };
      }
      return (
        <RestTimer
          durationSeconds={exercise.restSeconds || 60}
          endsAt={engine.restEndsAt}
          onDone={engine.restDone}
          onSkip={engine.skipRest}
          onAdd={() => engine.addRest(30)}
          nextSetPreview={nextPreview}
          justCompletedSet={justSet}
          exerciseName={exercise.name}
          setIndex={engine.currentSetIndex}
          totalSets={engine.totalSetsForExercise}
          audioEnabled={settings.audioEnabled}
          hapticsEnabled={settings.hapticsEnabled}
        />
      );
    }
    if ((engine.page === 'finisher' || engine.page === 'circuit') && block) {
      const miniWorkout = buildMiniWorkout(block);
      const onComplete =
        engine.page === 'finisher' ? engine.finisherComplete : engine.circuitComplete;
      return (
        <SkipPhaseRunner
          workout={miniWorkout}
          title={block.name}
          audioEnabled={settings.audioEnabled}
          hapticsEnabled={settings.hapticsEnabled}
          onComplete={onComplete}
          completeButtonLabel="Continue"
        />
      );
    }
    return null;
  }

  return (
    <div className="min-h-full flex flex-col pt-safe pb-safe">
      {header}
      {renderBody()}
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

function buildMiniWorkout(block) {
  // Convert a finisher/circuit block into the shape the skip engine expects.
  const rounds = block.rounds;
  const phases = [];
  for (let r = 0; r < rounds; r++) {
    for (const p of block.phases) {
      phases.push({ ...p, roundIndex: r });
    }
  }
  return { ...block, phases, rounds };
}

function ExitConfirm({ onKeep, onSaveSkipped, onExit }) {
  return (
    <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface-low border border-hairline-strong p-6">
        <div className="label-md text-crimson tracking-[0.32em]">◆&nbsp;&nbsp;Exit</div>
        <h3 className="mt-3 font-serif text-2xl text-ink leading-tight">Leave this workout?</h3>
        <p className="mt-3 body-md text-ink-dim">
          Save what you've completed as a skipped session, or exit without saving.
        </p>
        <div className="hairline mt-5" />
        <div className="mt-5 space-y-2">
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
