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
  // Heaviest weight and the reps at it.
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
    <div className="flex-1 flex flex-col px-5 pt-3 pb-5">
      {/* Header: name + pips + overflow menu */}
      <header className="flex items-start gap-2">
        <button
          onClick={onEditPrevious}
          disabled={setIndex === 0}
          aria-label="Previous set"
          className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0 pt-1">
          <h2 className="text-lg font-semibold text-neutral-100 truncate leading-tight">
            {exercise.name}
          </h2>
          <div className="mt-1.5">
            <SetPips total={totalSets} completed={setIndex} current={setIndex} />
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Exercise options"
            onClick={() => setShowMenu((v) => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <MoreVertical size={18} />
          </button>
          {showMenu ? (
            <div
              onMouseLeave={() => setShowMenu(false)}
              className="absolute right-0 mt-2 w-52 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl py-1 z-20"
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

      {/* Target + last time */}
      <div className="mt-4 rounded-2xl bg-neutral-900 border border-neutral-800 p-3 flex items-stretch gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-green-500">Target</div>
          <div className={[
            'mt-0.5 font-semibold truncate',
            isAmrap ? 'text-neutral-200 text-base' : 'text-neutral-100 text-base',
          ].join(' ')}>
            {targetText || '—'}
          </div>
          {exercise.tempo ? (
            <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
              Tempo {exercise.tempo}
            </div>
          ) : null}
        </div>
        <div className="w-px bg-neutral-800" />
        <div className="flex-1 min-w-0 text-right">
          <div className="text-[10px] uppercase tracking-widest text-neutral-500">Last time</div>
          <div className="mt-0.5 font-mono text-sm text-neutral-300 truncate">
            {lastText || '—'}
          </div>
        </div>
      </div>

      {showCues ? (
        <div className="mt-2 rounded-xl bg-neutral-900/60 border border-neutral-800 p-3">
          <FormCueList cues={exercise.formCues} compact />
        </div>
      ) : null}

      {/* Logged sets so far */}
      {loggedSets.length > 0 ? (
        <div className="mt-4">
          <LoggedSetsStrip sets={loggedSets} totalSets={totalSets} />
        </div>
      ) : null}

      {/* Inputs — side-by-side */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-neutral-500 mb-1.5">
            {isAmrap ? 'Reps (to failure)' : 'Reps'}
          </label>
          <CompactStepper
            value={reps}
            onChange={setReps}
            step={1}
            min={0}
            max={100}
            ariaLabel="reps"
            accent="text-neutral-100"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-neutral-500 mb-1.5">
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
            accent="text-neutral-100"
            inputMode="decimal"
          />
        </div>
      </div>

      {/* RPE — shown only on last set to stay fast on earlier sets */}
      {isLastSet ? (
        <div className="mt-5">
          <RPEChips value={rpe} onChange={setRpe} />
        </div>
      ) : null}

      <div className="mt-auto pt-6">
        <Button variant="primary" size="lg" className="w-full text-lg" onClick={handleLog}>
          Log set {setIndex + 1}
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
        'w-full text-left px-3 py-2.5 text-sm',
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-neutral-200 hover:bg-neutral-800',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
