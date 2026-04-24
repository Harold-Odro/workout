import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Repeat } from 'lucide-react';
import Button from '../components/Button.jsx';
import ExerciseBreakdown from '../components/ExerciseBreakdown.jsx';
import NumberStepper from '../components/NumberStepper.jsx';
import { WORKOUT_META } from '../lib/workouts.js';
import { PPL_META } from '../lib/workoutsPPL.js';
import { formatDuration, formatDateShort } from '../lib/time.js';
import {
  deleteSession,
  getSessionById,
  updateSession,
} from '../lib/storage.js';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editSet, setEditSet] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSession(getSessionById(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) return null;

  if (!session) {
    return (
      <div className="min-h-full pt-safe pb-32 px-8 pt-16 text-center">
        <p className="font-serif italic text-ink-dim text-lg">Session not found.</p>
        <Link to="/history" className="mt-6 inline-block label-md text-crimson hover:text-crimson-bright">
          ← Back to history
        </Link>
      </div>
    );
  }

  const isPPL = session.program === 'ppl';
  const meta = isPPL ? PPL_META[session.type] : WORKOUT_META[session.type];

  function handleDelete() {
    deleteSession(session.id);
    navigate('/history', { replace: true });
  }

  function handleEdit() {
    navigate('/log', {
      state: { draft: session, editingId: session.id },
    });
  }

  function handleRepeat() {
    navigate('/workout', { state: { type: session.type, program: session.program || 'skip' } });
  }

  function handleEditSet(exerciseId, setIndex) {
    setEditSet({ exerciseId, setIndex });
  }

  function applySetEdit(newSet) {
    const exercises = session.exercises.map((e) => {
      if (e.exerciseId !== editSet.exerciseId) return e;
      const sets = e.sets.map((s, i) => (i === editSet.setIndex ? { ...s, ...newSet } : s));
      return { ...e, sets };
    });
    const updated = updateSession(session.id, { exercises });
    setSession(updated);
    setEditSet(null);
  }

  const totalSets = isPPL
    ? (session.exercises || []).reduce(
        (a, e) => a + (e.sets || []).filter((s) => s.completed).length,
        0
      )
    : 0;

  return (
    <div className="min-h-full pt-safe pb-32">
      <header className="px-8 pt-12 flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center text-ink-faint hover:text-crimson transition-colors focus:outline-none focus-visible:text-crimson"
        >
          <ArrowLeft size={20} strokeWidth={1.4} />
        </button>
        <div className="flex-1">
          <div className="label-md text-crimson tracking-[0.32em]">
            {isPPL ? 'PPL · Session' : 'Skip · Session'}
          </div>
          <h1 className="mt-3 font-serif text-4xl font-light text-ink leading-tight">
            {meta?.name || session.type}
          </h1>
          <div className="hairline-strong mt-6" />
        </div>
      </header>

      <div className="px-8 mt-8 space-y-px bg-hairline">
        <Stat label="Date" value={formatDateShort(session.date)} />
        <Stat label="Duration" value={formatDuration(session.durationSeconds)} mono />
        {!isPPL ? (
          <Stat
            label="Rounds"
            value={`${session.completedRounds} / ${session.plannedRounds}`}
            mono
          />
        ) : (
          <Stat label="Sets completed" value={totalSets} mono />
        )}
        {typeof session.rpe === 'number' && session.rpe > 0 ? (
          <Stat label="RPE" value={session.rpe} mono accent />
        ) : null}
        {session.skipped ? <Stat label="Status" value="Skipped" /> : null}
      </div>

      {session.notes ? (
        <div className="px-8 mt-8">
          <div className="bg-surface-low border-l-2 border-crimson px-5 py-4">
            <div className="label-md text-crimson">Notes</div>
            <pre className="mt-3 whitespace-pre-wrap font-serif italic text-base text-ink-dim leading-relaxed">
              {session.notes}
            </pre>
          </div>
        </div>
      ) : null}

      {isPPL && session.exercises?.length > 0 ? (
        <div className="px-8 mt-10">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="label-md text-crimson tracking-[0.2em]">Exercises</h2>
            <span className="hairline flex-1" />
            <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint">
              {String(session.exercises.length).padStart(2, '0')}
            </span>
          </div>
          <ExerciseBreakdown
            exercises={session.exercises}
            defaultOpen
            editable
            onEditSet={handleEditSet}
          />
        </div>
      ) : null}

      <div className="px-8 mt-10 space-y-3">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={handleEdit}
          >
            <Pencil size={14} strokeWidth={1.6} className="mr-2" /> Edit
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={14} strokeWidth={1.6} className="mr-2" /> Delete
          </Button>
        </div>
        {isPPL ? (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleRepeat}
          >
            <Repeat size={14} strokeWidth={1.6} className="mr-2" /> Repeat workout
          </Button>
        ) : null}
      </div>

      {editSet ? (
        <EditSetModal
          session={session}
          editSet={editSet}
          onCancel={() => setEditSet(null)}
          onSave={applySetEdit}
        />
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-30 bg-black/80 flex items-end sm:items-center justify-center p-4 backdrop-blur">
          <div className="w-full max-w-sm bg-surface-low border border-hairline-strong p-6">
            <h3 className="font-serif text-2xl text-ink leading-tight">Delete session?</h3>
            <p className="mt-3 body-md text-ink-dim">This can't be undone.</p>
            <div className="hairline mt-5" />
            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, mono, accent }) {
  return (
    <div className="flex items-baseline justify-between bg-surface-1 px-5 py-4">
      <span className="label-md text-ink-faint">{label}</span>
      <span
        className={[
          mono ? 'font-mono tabular text-lg' : 'font-serif text-lg',
          accent ? 'text-crimson' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

function EditSetModal({ session, editSet, onCancel, onSave }) {
  const entry = session.exercises.find((e) => e.exerciseId === editSet.exerciseId);
  const set = entry?.sets?.[editSet.setIndex];
  const isUnilateral = set && (set.left || set.right);

  const [reps, setReps] = useState(() => (isUnilateral ? 0 : Number(set?.reps) || 0));
  const [weight, setWeight] = useState(() => (isUnilateral ? 0 : Number(set?.weightKg) || 0));
  const [leftReps, setLeftReps] = useState(() => Number(set?.left?.reps) || 0);
  const [leftWeight, setLeftWeight] = useState(() => Number(set?.left?.weightKg) || 0);
  const [rightReps, setRightReps] = useState(() => Number(set?.right?.reps) || 0);
  const [rightWeight, setRightWeight] = useState(() => Number(set?.right?.weightKg) || 0);
  const [rpe, setRpe] = useState(() => Number(set?.rpe) || 0);

  function save() {
    if (isUnilateral) {
      onSave({
        left: { reps: leftReps, weightKg: leftWeight },
        right: { reps: rightReps, weightKg: rightWeight },
        rpe: rpe > 0 ? rpe : null,
        completed: true,
      });
    } else {
      onSave({
        reps,
        weightKg: weight,
        rpe: rpe > 0 ? rpe : null,
        completed: true,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface-low border border-hairline-strong p-6 max-h-[90vh] overflow-auto">
        <div className="label-md text-crimson tracking-[0.32em]">
          ◆&nbsp;&nbsp;Edit set {String(editSet.setIndex + 1).padStart(2, '0')}
        </div>
        <h3 className="mt-3 font-serif text-2xl text-ink leading-tight">{entry?.name}</h3>
        <div className="hairline mt-5" />

        <div className="mt-6 space-y-6">
          {isUnilateral ? (
            <>
              <div>
                <div className="label-md text-crimson mb-3">Left</div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberStepper value={leftReps} onChange={setLeftReps} step={1} min={0} max={100} ariaLabel="Left reps" />
                  <NumberStepper value={leftWeight} onChange={setLeftWeight} step={0.5} min={0} max={500} decimals={1} suffix="kg" ariaLabel="Left weight" inputMode="decimal" />
                </div>
              </div>
              <div>
                <div className="label-md text-crimson mb-3">Right</div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberStepper value={rightReps} onChange={setRightReps} step={1} min={0} max={100} ariaLabel="Right reps" />
                  <NumberStepper value={rightWeight} onChange={setRightWeight} step={0.5} min={0} max={500} decimals={1} suffix="kg" ariaLabel="Right weight" inputMode="decimal" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="label-md text-ink-faint mb-3">Reps</div>
                <NumberStepper value={reps} onChange={setReps} step={1} min={0} max={100} ariaLabel="Reps" />
              </div>
              <div>
                <div className="label-md text-ink-faint mb-3">Weight</div>
                <NumberStepper value={weight} onChange={setWeight} step={0.5} min={0} max={500} decimals={1} suffix="kg" ariaLabel="Weight" inputMode="decimal" />
              </div>
            </>
          )}

          <div>
            <div className="flex items-baseline justify-between">
              <span className="label-md text-ink-faint">Per-set RPE</span>
              <span className="font-mono tabular text-lg text-crimson">{rpe || '—'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
              className="w-full accent-crimson-bright mt-3 h-1"
            />
          </div>
        </div>

        <div className="mt-7 flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="flex-1" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
