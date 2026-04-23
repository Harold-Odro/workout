import Button from './Button.jsx';
import FormCueList from './FormCueList.jsx';

function formatRepRange(exercise) {
  if (!exercise.targetReps) return exercise.targetRepsNote || '—';
  const [lo, hi] = exercise.targetReps;
  const range = lo === hi ? `${lo}` : `${lo}–${hi}`;
  const note = exercise.unilateralNote ? ` ${exercise.unilateralNote}` : '';
  return `${range}${note}`;
}

function lastSessionSummary(lastEntry) {
  if (!lastEntry) return null;
  const completed = (lastEntry.sets || []).filter((s) => s.completed);
  if (completed.length === 0) return null;
  // Find heaviest weight.
  let heaviest = 0;
  let repsAtHeaviest = 0;
  for (const s of completed) {
    const w = Number(s.weightKg) || 0;
    if (w >= heaviest) {
      heaviest = w;
      repsAtHeaviest = Number(s.reps) || 0;
    }
  }
  return `${completed.length} × ${repsAtHeaviest} @ ${heaviest}kg`;
}

export default function ExerciseIntro({
  exercise,
  lastEntry,
  exerciseIndex,
  totalExercises,
  onStart,
  onSkip,
}) {
  const repText = formatRepRange(exercise);
  const restText = `${exercise.restSeconds}s rest`;
  const tempoText = exercise.tempo ? `· ${exercise.tempo}` : '';
  const lastText = lastSessionSummary(lastEntry);

  return (
    <div className="flex-1 flex flex-col px-5 pt-6 pb-6">
      <div className="text-xs text-neutral-500 uppercase tracking-wider">
        Exercise {exerciseIndex + 1} of {totalExercises}
      </div>
      <h2 className="mt-1 text-3xl font-semibold text-neutral-100">{exercise.name}</h2>
      <div className="mt-1 text-sm text-neutral-400">
        {exercise.sets} sets × {repText} · {restText} {tempoText}
      </div>

      {lastText ? (
        <div className="mt-4 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Last time</div>
          <div className="mt-1 text-sm font-mono text-neutral-200">{lastText}</div>
        </div>
      ) : null}

      <div className="mt-6 flex-1">
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Form cues</div>
        <FormCueList cues={exercise.formCues} />
      </div>

      <div className="mt-6 space-y-3">
        <Button variant="primary" size="lg" className="w-full" onClick={onStart}>
          Start exercise
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-sm text-neutral-500 hover:text-neutral-300 py-2"
        >
          Skip exercise
        </button>
      </div>
    </div>
  );
}
