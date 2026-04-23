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
  const [editSet, setEditSet] = useState(null); // { exerciseId, setIndex }
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSession(getSessionById(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) return null;

  if (!session) {
    return (
      <div className="min-h-full pt-safe pb-24 px-5 pt-10 text-center">
        <p className="text-neutral-500">Session not found.</p>
        <Link to="/history" className="mt-4 inline-block text-green-500">
          Back to history
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
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="text-xs uppercase tracking-widest text-green-500">
            {isPPL ? 'PPL session' : 'Skip session'}
          </div>
          <h1 className="text-xl font-semibold text-neutral-100">
            {meta?.name || session.type}
          </h1>
        </div>
      </header>

      <div className="px-5 mt-6 space-y-3">
        <Stat label="Date" value={formatDateShort(session.date)} />
        <Stat label="Duration" value={formatDuration(session.durationSeconds)} />
        {!isPPL ? (
          <Stat
            label="Rounds"
            value={`${session.completedRounds} / ${session.plannedRounds}`}
          />
        ) : (
          <Stat label="Sets completed" value={totalSets} mono />
        )}
        {typeof session.rpe === 'number' && session.rpe > 0 ? (
          <Stat label="RPE" value={session.rpe} mono />
        ) : null}
        {session.skipped ? <Stat label="Status" value="Skipped" /> : null}
        {session.notes ? (
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3">
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
              Notes
            </div>
            <pre className="whitespace-pre-wrap text-sm text-neutral-200 font-sans">
              {session.notes}
            </pre>
          </div>
        ) : null}
      </div>

      {isPPL && session.exercises?.length > 0 ? (
        <div className="px-5 mt-6">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
            Exercises
          </h2>
          <ExerciseBreakdown
            exercises={session.exercises}
            defaultOpen
            editable
            onEditSet={handleEditSet}
          />
        </div>
      ) : null}

      <div className="px-5 mt-8 space-y-3">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={handleEdit}
          >
            <Pencil size={16} className="mr-2" /> Edit details
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={16} className="mr-2" /> Delete
          </Button>
        </div>
        {isPPL ? (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleRepeat}
          >
            <Repeat size={16} className="mr-2" /> Repeat this workout
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
        <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h3 className="text-lg font-semibold text-neutral-100">Delete session?</h3>
            <p className="mt-1 text-sm text-neutral-400">This can't be undone.</p>
            <div className="mt-4 flex gap-3">
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

function Stat({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3">
      <span className="text-sm text-neutral-400">{label}</span>
      <span
        className={[
          'text-neutral-100',
          mono ? 'font-mono text-lg' : 'text-base',
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
    <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-semibold text-neutral-100">
          Edit set {editSet.setIndex + 1}
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">{entry?.name}</p>

        <div className="mt-5 space-y-5">
          {isUnilateral ? (
            <>
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Left</div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberStepper value={leftReps} onChange={setLeftReps} step={1} min={0} max={100} ariaLabel="Left reps" />
                  <NumberStepper value={leftWeight} onChange={setLeftWeight} step={0.5} min={0} max={500} decimals={1} suffix="kg" ariaLabel="Left weight" inputMode="decimal" />
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Right</div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberStepper value={rightReps} onChange={setRightReps} step={1} min={0} max={100} ariaLabel="Right reps" />
                  <NumberStepper value={rightWeight} onChange={setRightWeight} step={0.5} min={0} max={500} decimals={1} suffix="kg" ariaLabel="Right weight" inputMode="decimal" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Reps</div>
                <NumberStepper value={reps} onChange={setReps} step={1} min={0} max={100} ariaLabel="Reps" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Weight</div>
                <NumberStepper value={weight} onChange={setWeight} step={0.5} min={0} max={500} decimals={1} suffix="kg" ariaLabel="Weight" inputMode="decimal" />
              </div>
            </>
          )}

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-neutral-400">Per-set RPE</span>
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
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
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
