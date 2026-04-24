import { useMemo, useState } from 'react';
import { MoreVertical, ArrowLeft } from 'lucide-react';
import Button from './Button.jsx';
import CompactStepper from './CompactStepper.jsx';
import FormCueList from './FormCueList.jsx';
import SetPips from './SetPips.jsx';
import LoggedSetsStrip from './LoggedSetsStrip.jsx';
import RPEChips from './RPEChips.jsx';

function initialReps(exercise, lastEntry, setIndex, side) {
  const last = lastEntry?.sets?.[setIndex];
  const v = last?.[side]?.reps;
  if (Number.isFinite(Number(v))) return Number(v);
  if (!exercise.targetReps) return 0;
  return exercise.targetReps[0];
}

function initialWeight(exercise, lastEntry, setIndex, side, prefill) {
  const last = lastEntry?.sets?.[setIndex];
  const v = last?.[side]?.weightKg;
  if (Number.isFinite(Number(v))) return Number(v);
  return prefill;
}

function lastSummary(lastEntry) {
  const completed = (lastEntry?.sets || []).filter((s) => s.completed);
  if (completed.length === 0) return null;
  let hW = 0;
  let hReps = 0;
  for (const s of completed) {
    const l = Number(s.left?.weightKg) || 0;
    const r = Number(s.right?.weightKg) || 0;
    if (l >= hW) { hW = l; hReps = Number(s.left?.reps) || 0; }
    if (r >= hW) { hW = r; hReps = Number(s.right?.reps) || 0; }
  }
  return `${completed.length} × ${hReps} @ ${hW}kg`;
}

export default function UnilateralSetLogger({
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

  const [leftReps, setLeftReps] = useState(() => initialReps(exercise, lastEntry, setIndex, 'left'));
  const [leftWeight, setLeftWeight] = useState(() => initialWeight(exercise, lastEntry, setIndex, 'left', weightPrefill));
  const [rightReps, setRightReps] = useState(() => initialReps(exercise, lastEntry, setIndex, 'right'));
  const [rightWeight, setRightWeight] = useState(() => initialWeight(exercise, lastEntry, setIndex, 'right', weightPrefill));
  const [rpe, setRpe] = useState(0);
  const [showCues, setShowCues] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const targetText = useMemo(() => {
    if (!exercise.targetReps) return '';
    const [lo, hi] = exercise.targetReps;
    const range = lo === hi ? `${lo} reps` : `${lo}–${hi} reps`;
    return `${range} per side`;
  }, [exercise]);

  const lastText = lastSummary(lastEntry);

  function mirrorLeftToRight() {
    setRightReps(leftReps);
    setRightWeight(leftWeight);
  }

  function handleLog() {
    onLog({
      left: { reps: Number(leftReps) || 0, weightKg: Number(leftWeight) || 0 },
      right: { reps: Number(rightReps) || 0, weightKg: Number(rightWeight) || 0 },
      rpe: rpe > 0 ? Number(rpe) : null,
    });
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-3 pb-5">
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

      <Side
        label="Left"
        reps={leftReps}
        weight={leftWeight}
        onReps={setLeftReps}
        onWeight={setLeftWeight}
      />
      <div className="mt-4">
        <Side
          label="Right"
          reps={rightReps}
          weight={rightWeight}
          onReps={setRightReps}
          onWeight={setRightWeight}
          action={
            <button
              type="button"
              onClick={mirrorLeftToRight}
              className="label-md text-ink-faint hover:text-crimson px-2 py-1 transition-colors"
            >
              Same as left
            </button>
          }
        />
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

function Side({ label, reps, weight, onReps, onWeight, action }) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="label-md text-crimson">{label}</span>
        {action}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CompactStepper
          value={reps}
          onChange={onReps}
          step={1}
          min={0}
          max={100}
          ariaLabel={`${label} reps`}
          inputMode="numeric"
        />
        <CompactStepper
          value={weight}
          onChange={onWeight}
          step={0.5}
          min={0}
          max={500}
          decimals={1}
          suffix="kg"
          ariaLabel={`${label} weight`}
          inputMode="decimal"
        />
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
