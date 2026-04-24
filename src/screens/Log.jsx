import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import ExerciseBreakdown from '../components/ExerciseBreakdown.jsx';
import SessionReceipt, { findPR } from '../components/SessionReceipt.jsx';
import { WORKOUT_META } from '../lib/workouts.js';
import { PPL_META } from '../lib/workoutsPPL.js';
import { formatDuration } from '../lib/time.js';
import {
  addPendingExerciseProgression,
  getSessions,
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

  // Snapshot prior sessions ONCE at mount. The draft hasn't been saved yet,
  // so this is the correct "before" set for PR detection. We deliberately
  // don't update this when the user re-opens the screen via edit (handled
  // by the editingId branch below).
  const priorSessions = useMemo(() => (editingId ? [] : getSessions()), [editingId]);
  const showReceipt = !editingId && !draft.skipped;
  const prLabel = useMemo(
    () => (showReceipt ? findPR({ draft, priorSessions }) : null),
    [showReceipt, draft, priorSessions]
  );

  // Soft haptic on arrival; a heavier pattern if a PR is present.
  useEffect(() => {
    if (!showReceipt) return;
    try {
      if (prLabel) navigator.vibrate?.([60, 50, 120]);
      else navigator.vibrate?.(40);
    } catch {}
  }, [showReceipt, prLabel]);

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
    <div className="min-h-full pt-safe pb-12">
      <header className="px-8 pt-12 pb-2">
        <div className="label-md text-crimson tracking-[0.32em]">
          ◆&nbsp;&nbsp;{editingId ? 'Edit session' : 'Workout complete'}
        </div>
        <h1 className="mt-3 font-serif text-4xl font-light text-ink leading-tight">
          {meta?.name || draft.type}
        </h1>
        <div className="mt-3 font-mono text-sm tabular text-ink-dim">
          {formatDuration(draft.durationSeconds)}
          {isPPL && totalSets > 0 ? ` · ${totalSets} set${totalSets === 1 ? '' : 's'}` : ''}
          {!isPPL && draft.plannedRounds
            ? ` · ${draft.plannedRounds} rounds planned`
            : ''}
        </div>
        <div className="hairline-strong mt-6" />
      </header>

      {showReceipt ? (
        <section className="px-8 mt-10" aria-label="Session ticket">
          <SessionReceipt draft={draft} priorSessions={priorSessions} />
          <p className="mt-6 font-serif italic text-center text-ink-dim text-sm">
            Sign off below to file it.
          </p>
        </section>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="px-8 mt-8 space-y-8"
      >
        {isPPL && draft.exercises?.length > 0 ? (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="label-md text-crimson tracking-[0.2em]">Exercise summary</span>
              <span className="hairline flex-1" />
              <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint">
                {String(draft.exercises.length).padStart(2, '0')}
              </span>
            </div>
            <ExerciseBreakdown exercises={draft.exercises} defaultOpen={false} />
          </div>
        ) : null}

        {!isPPL ? (
          <div>
            <label htmlFor="rounds" className="block label-md text-ink-faint mb-2">
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
              className="w-full bg-transparent border-0 border-b border-hairline-strong pb-3 pt-1 font-serif font-light text-3xl tabular text-ink focus:outline-none focus:border-crimson transition-colors"
            />
          </div>
        ) : null}

        <div>
          <div className="label-md text-ink-faint mb-2">Duration</div>
          <div className="font-serif font-light text-3xl tabular text-ink-dim border-b border-hairline-strong pb-3">
            {formatDuration(draft.durationSeconds)}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label htmlFor="rpe" className="label-md text-ink-faint">
              Overall effort · RPE
            </label>
            <div>
              <span className="font-serif font-light text-3xl tabular text-crimson">{rpe}</span>
              <span className="ml-3 font-serif italic text-ink-dim">{rpeDescriptor(rpe)}</span>
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
            className="w-full accent-crimson-bright h-1"
          />
          <div className="mt-2 flex justify-between label-md text-ink-faint">
            <span>Easy</span>
            <span>Max effort</span>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block label-md text-ink-faint mb-2">
            Notes · optional
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any pain? Energy level?"
            rows={4}
            className="w-full bg-surface-low border border-hairline-strong px-4 py-3 font-serif text-base text-ink placeholder:text-ink-faint placeholder:italic focus:outline-none focus:border-crimson transition-colors resize-none rounded"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {editingId ? 'Save changes' : 'Save session'}
          </Button>
          <button
            type="button"
            onClick={handleDiscard}
            className="mt-5 w-full label-md text-ink-faint hover:text-crimson py-2 transition-colors"
          >
            {editingId ? 'Cancel' : 'Discard'}
          </button>
        </div>
      </form>
    </div>
  );
}
