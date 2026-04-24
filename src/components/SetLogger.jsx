import { useMemo, useState } from 'react';
import { MoreVertical, ArrowLeft } from 'lucide-react';
import Button from './Button.jsx';
import CompactStepper from './CompactStepper.jsx';
import FormCueList from './FormCueList.jsx';
import SetPips from './SetPips.jsx';
import LoggedSetsStrip from './LoggedSetsStrip.jsx';
import RPEChips from './RPEChips.jsx';

function initialReps(exercise, lastEntry, setIndex) {
  if (exercise.amrap) return 0;
  const last = lastEntry?.sets?.[setIndex];
  if (last && Number.isFinite(Number(last.reps))) return Number(last.reps);
  if (!exercise.targetReps) return 0;
  return exercise.targetReps[0];
}

function initialWeight(exercise, lastEntry, setIndex, prefill) {
  const last = lastEntry?.sets?.[setIndex];
  if (last && Number.isFinite(Number(last.weightKg))) return Number(last.weightKg);
  return prefill;
}

function lastSummary(lastEntry) {
  const completed = (lastEntry?.sets || []).filter((s) => s.completed);
  if (completed.length === 0) return null;
  let heaviestW = 0;
  let reps = 0;
  for (const s of completed) {
    const w = Number(s.weightKg) || 0;
    if (w >= heaviestW) { heaviestW = w; reps = Number(s.reps) || 0; }
  }
  return `${completed.length} × ${reps} @ ${heaviestW}kg`;
}

export default function SetLogger({
  exercise,
  setIndex,
  totalSets,
  loggedSets,
  lastEntry,
  weightPrefill,
  onLog,
  onEditPrevious,
  onSkipRemaining,
  onSkipExercise,
  onEndWorkout,
}) {
  const isLastSet = setIndex >= totalSets - 1;
  const isAmrap = !!exercise.amrap;

  const [reps, setReps] = useState(() => initialReps(exercise, lastEntry, setIndex));
  const [weightKg, setWeightKg] = useState(() => initialWeight(exercise, lastEntry, setIndex, weightPrefill));
  const [rpe, setRpe] = useState(0);
  const [showCues, setShowCues] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const targetText = useMemo(() => {
    if (exercise.amrap) return exercise.targetRepsNote || 'AMRAP';
    if (!exercise.targetReps) return '';
    const [lo, hi] = exercise.targetReps;
    const range = lo === hi ? `${lo} reps` : `${lo}–${hi} reps`;
    const note = exercise.unilateralNote ? ` ${exercise.unilateralNote}` : '';
    return `${range}${note}`;
  }, [exercise]);

  const lastText = lastSummary(lastEntry);

  function handleLog() {
    onLog({
      reps: Number(reps) || 0,
      weightKg: Number(weightKg) || 0,
      rpe: rpe > 0 ? Number(rpe) : null,
    });
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-3 pb-5">
      {/* Header */}
      <header className="flex items-start gap-2">
        <button
          onClick={onEditPrevious}
          disabled={setIndex === 0}
          aria-label="Previous set"
          className="w-9 h-9 flex items-center justify-center text-ink-faint hover:text-crimson disabled:opacity-30 transition-colors focus:outline-none focus-visible:text-crimson"
        >
          <ArrowLeft size={18} strokeWidth={1.4} />
        </button>
        <div className="flex-1 min-w-0 pt-1">
          <div className="label-md text-ink-faint mb-1">
            Set <span className="text-crimson tabular">{String(setIndex + 1).padStart(2, '0')}</span> · of {String(totalSets).padStart(2, '0')}
          </div>
          <h2 className="font-serif text-2xl text-ink truncate leading-tight">
            {exercise.name}
          </h2>
          <div className="mt-2.5">
            <SetPips total={totalSets} completed={setIndex} current={setIndex} />
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Exercise options"
            onClick={() => setShowMenu((v) => !v)}
            className="w-9 h-9 flex items-center justify-center text-ink-faint hover:text-crimson transition-colors focus:outline-none focus-visible:text-crimson"
          >
            <MoreVertical size={18} strokeWidth={1.4} />
          </button>
          {showMenu ? (
            <div
              onMouseLeave={() => setShowMenu(false)}
              className="absolute right-0 mt-2 w-56 rounded bg-surface-low border border-hairline-strong shadow-2xl py-1 z-20"
            >
              <MenuItem onClick={() => { setShowMenu(false); setShowCues((v) => !v); }}>
                {showCues ? 'Hide form cues' : 'Show form cues'}
              </MenuItem>
              <MenuItem onClick={() => { setShowMenu(false); onSkipRemaining(); }}>
                Skip remaining sets
              </MenuItem>
              <MenuItem onClick={() => { setShowMenu(false); onSkipExercise(); }}>
                Skip exercise
              </MenuItem>
              <MenuItem onClick={() => { setShowMenu(false); onEndWorkout(); }} danger>
                End workout
              </MenuItem>
            </div>
          ) : null}
        </div>
      </header>

      {/* Target + last */}
      <div className="mt-5 flex items-stretch gap-0 border border-hairline">
        <div className="flex-1 min-w-0 px-4 py-3">
          <div className="label-md text-crimson">Target</div>
          <div className="mt-1.5 font-serif text-lg text-ink truncate">
            {targetText || '—'}
          </div>
          {exercise.tempo ? (
            <div className="font-mono text-[11px] tabular text-ink-faint mt-1">
              Tempo&nbsp;{exercise.tempo}
            </div>
          ) : null}
        </div>
        <div className="w-px bg-hairline-strong" />
        <div className="flex-1 min-w-0 px-4 py-3 text-right">
          <div className="label-md text-ink-faint">Last time</div>
          <div className="mt-1.5 font-mono tabular text-sm text-ink-dim truncate">
            {lastText || '—'}
          </div>
        </div>
      </div>

      {showCues ? (
        <div className="mt-3 bg-surface-low border border-hairline px-4 py-3">
          <FormCueList cues={exercise.formCues} compact />
        </div>
      ) : null}

      {loggedSets.length > 0 ? (
        <div className="mt-5">
          <LoggedSetsStrip sets={loggedSets} totalSets={totalSets} />
        </div>
      ) : null}

      {/* Inputs */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <label className="block label-md text-ink-faint mb-2">
            {isAmrap ? 'Reps · to failure' : 'Reps'}
          </label>
          <CompactStepper
            value={reps}
            onChange={setReps}
            step={1}
            min={0}
            max={100}
            ariaLabel="reps"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="block label-md text-ink-faint mb-2">
            Weight
          </label>
          <CompactStepper
            value={weightKg}
            onChange={setWeightKg}
            step={0.5}
            min={0}
            max={500}
            decimals={1}
            suffix="kg"
            ariaLabel="weight"
            inputMode="decimal"
          />
        </div>
      </div>

      {isLastSet ? (
        <div className="mt-6">
          <RPEChips value={rpe} onChange={setRpe} />
        </div>
      ) : null}

      <div className="mt-auto pt-6">
        <Button variant="primary" size="lg" className="w-full" onClick={handleLog}>
          Log set {String(setIndex + 1).padStart(2, '0')}
        </Button>
      </div>
    </div>
  );
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-4 py-3 font-serif text-[15px] transition-colors',
        danger ? 'text-error hover:bg-error-container/40' : 'text-ink hover:bg-surface-high hover:text-crimson',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
