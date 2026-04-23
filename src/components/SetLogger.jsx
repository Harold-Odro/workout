import { useMemo, useState } from 'react';
import { Info, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import Button from './Button.jsx';
import NumberStepper from './NumberStepper.jsx';
import SetRow from './SetRow.jsx';
import FormCueList from './FormCueList.jsx';

function initialReps(exercise, lastEntry, setIndex) {
  if (exercise.amrap) return 0;
  // Prefer last session's value for this set index.
  const last = lastEntry?.sets?.[setIndex];
  if (last && Number.isFinite(Number(last.reps))) return Number(last.reps);
  if (!exercise.targetReps) return 0;
  return exercise.targetReps[0]; // lower bound
}

function initialWeight(exercise, lastEntry, setIndex, prefill) {
  const last = lastEntry?.sets?.[setIndex];
  if (last && Number.isFinite(Number(last.weightKg))) return Number(last.weightKg);
  return prefill;
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
  const [rpeOpen, setRpeOpen] = useState(isLastSet);
  const [showCues, setShowCues] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const targetText = useMemo(() => {
    if (exercise.amrap) return exercise.targetRepsNote || 'AMRAP';
    if (!exercise.targetReps) return '';
    const [lo, hi] = exercise.targetReps;
    const range = lo === hi ? `${lo}` : `${lo}–${hi}`;
    const note = exercise.unilateralNote ? ` ${exercise.unilateralNote}` : '';
    return `Target: ${range}${note}`;
  }, [exercise]);

  function handleLog() {
    onLog({
      reps: Number(reps) || 0,
      weightKg: Number(weightKg) || 0,
      rpe: rpe > 0 ? Number(rpe) : null,
    });
  }

  return (
    <div className="flex-1 flex flex-col px-5 pt-4 pb-6">
      <header className="flex items-center justify-between">
        <button
          onClick={onEditPrevious}
          disabled={setIndex === 0}
          aria-label="Previous set"
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-neutral-500">Set</div>
          <div className="font-mono text-lg text-neutral-100">
            {setIndex + 1} / {totalSets}
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Exercise options"
            onClick={() => setShowMenu((v) => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <Info size={18} />
          </button>
          {showMenu ? (
            <div
              onMouseLeave={() => setShowMenu(false)}
              className="absolute right-0 mt-2 w-48 rounded-xl bg-neutral-900 border border-neutral-800 shadow-lg py-1 z-20"
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

      <div className="mt-2">
        <h2 className="text-xl font-semibold text-neutral-100">{exercise.name}</h2>
        {targetText ? (
          <p className="text-sm text-neutral-400 mt-0.5">{targetText}</p>
        ) : null}
      </div>

      {showCues ? (
        <div className="mt-3 rounded-xl bg-neutral-900 border border-neutral-800 p-3">
          <FormCueList cues={exercise.formCues} compact />
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        <div>
          <div className="text-center text-xs uppercase tracking-widest text-neutral-500 mb-3">
            Reps
          </div>
          <NumberStepper
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
          <div className="text-center text-xs uppercase tracking-widest text-neutral-500 mb-3">
            Weight
          </div>
          <NumberStepper
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

        <div>
          <button
            type="button"
            onClick={() => setRpeOpen((v) => !v)}
            className="w-full flex items-center justify-between px-1 text-sm text-neutral-400"
            aria-expanded={rpeOpen}
          >
            <span>Per-set RPE (optional)</span>
            {rpeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {rpeOpen ? (
            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-neutral-500">How hard was this set?</span>
                <span className="font-mono text-green-500">{rpe || '—'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full accent-green-500 mt-1 h-2"
                aria-label="Set RPE"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button variant="primary" size="lg" className="w-full" onClick={handleLog}>
          Log set
        </Button>
      </div>

      {loggedSets.length > 0 ? (
        <div className="mt-6 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2">
          {loggedSets.map((set, i) => (
            <SetRow key={i} index={i} set={set} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2 text-sm',
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-neutral-200 hover:bg-neutral-800',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
