import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import ExerciseBreakdown from '../components/ExerciseBreakdown.jsx';
import { WORKOUT_META } from '../lib/workouts.js';
import { PPL_META } from '../lib/workoutsPPL.js';
import { formatDuration } from '../lib/time.js';
import {
  addPendingExerciseProgression,
  getState,
  saveSession,
  setPendingProgression,
  updateSession,
} from '../lib/storage.js';
import { shouldSuggestProgression } from '../lib/progression.js';
import { newSuggestionsFromSession } from '../lib/progressionPPL.js';

function rpeDescriptor(v) {
  if (v <= 2) return 'Easy';
  if (v <= 4) return 'Light';
  if (v <= 6) return 'Moderate';
  if (v <= 8) return 'Hard';
  if (v <= 9) return 'Very hard';
  return 'Max effort';
}

export default function Log({ setToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const draft = location.state?.draft;
  const editingId = location.state?.editingId || null;

  if (!draft) return <Navigate to="/" replace />;

  const program = draft.program || 'skip';
  const meta = program === 'ppl' ? PPL_META[draft.type] : WORKOUT_META[draft.type];

  const [completedRounds, setCompletedRounds] = useState(
    draft.completedRounds ?? draft.plannedRounds ?? 0
  );
  const [rpe, setRpe] = useState(typeof draft.rpe === 'number' ? draft.rpe : 6);
  const [notes, setNotes] = useState(draft.notes || '');

  function handleSave() {
    const patch = {
      rpe: Number(rpe),
      notes: notes.trim(),
    };
    if (program === 'skip') {
      patch.completedRounds = Number(completedRounds) || 0;
    }

    if (editingId) {
      updateSession(editingId, patch);
      setToast?.(`${meta?.name || 'Workout'} updated.`);
      navigate(`/session/${editingId}`, { replace: true });
      return;
    }

    const saved = saveSession({ ...draft, ...patch });
    const after = getState();

    if (program === 'skip') {
      const suggestion = shouldSuggestProgression(after, draft.type);
      if (suggestion && !after.pendingProgression) {
        setPendingProgression(suggestion);
      }
    } else if (program === 'ppl') {
      const suggestions = newSuggestionsFromSession(after, saved);
      for (const s of suggestions) addPendingExerciseProgression(s);
    }

    setToast?.(`${meta?.name || 'Workout'} saved.`);
    navigate('/', { replace: true });
  }

  function handleDiscard() {
    if (editingId) navigate(`/session/${editingId}`, { replace: true });
    else navigate('/', { replace: true });
  }

  const isPPL = program === 'ppl';
  const totalSets = isPPL
    ? (draft.exercises || []).reduce(
        (a, e) => a + (e.sets || []).filter((s) => s.completed).length,
        0
      )
    : 0;

  return (
    <div className="min-h-full pt-safe pb-10">
      <header className="px-5 pt-6 pb-4">
        <div className="text-xs uppercase tracking-widest text-green-500">
          {editingId ? 'Edit session' : 'Workout complete'}
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-100">
          {meta?.name || draft.type}
        </h1>
        <div className="mt-1 text-sm text-neutral-400">
          {formatDuration(draft.durationSeconds)}
          {isPPL && totalSets > 0 ? ` · ${totalSets} set${totalSets === 1 ? '' : 's'}` : ''}
          {!isPPL && draft.plannedRounds
            ? ` · ${draft.plannedRounds} rounds planned`
            : ''}
        </div>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="px-5 space-y-5"
      >
        {isPPL && draft.exercises?.length > 0 ? (
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Exercise summary
            </label>
            <ExerciseBreakdown exercises={draft.exercises} defaultOpen={false} />
          </div>
        ) : null}

        {!isPPL ? (
          <div>
            <label htmlFor="rounds" className="block text-sm text-neutral-400 mb-1">
              Completed rounds
            </label>
            <input
              id="rounds"
              type="number"
              inputMode="numeric"
              min="0"
              max={(draft.plannedRounds || 0) + 10}
              value={completedRounds}
              onChange={(e) => setCompletedRounds(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-lg text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            />
          </div>
        ) : null}

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Duration</label>
          <div className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-lg text-neutral-300">
            {formatDuration(draft.durationSeconds)}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="rpe" className="text-sm text-neutral-400">
              Overall effort (RPE)
            </label>
            <div className="text-sm">
              <span className="font-mono text-2xl text-green-500">{rpe}</span>
              <span className="ml-2 text-neutral-400">{rpeDescriptor(rpe)}</span>
            </div>
          </div>
          <input
            id="rpe"
            type="range"
            min="1"
            max="10"
            step="1"
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value))}
            className="w-full accent-green-500 h-2"
          />
          <div className="mt-1 flex justify-between text-xs text-neutral-500">
            <span>Easy</span>
            <span>Max effort</span>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm text-neutral-400 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any pain? Energy level?"
            rows={4}
            className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 resize-none"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {editingId ? 'Save changes' : 'Save session'}
          </Button>
          <button
            type="button"
            onClick={handleDiscard}
            className="mt-4 w-full text-sm text-neutral-500 hover:text-neutral-300 py-2"
          >
            {editingId ? 'Cancel' : 'Discard'}
          </button>
        </div>
      </form>
    </div>
  );
}
