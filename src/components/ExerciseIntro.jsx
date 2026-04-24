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
    <div className="flex-1 flex flex-col px-6 pt-8 pb-7">
      <div className="label-md text-ink-faint">
        Exercise <span className="text-crimson tabular">{String(exerciseIndex + 1).padStart(2, '0')}</span> · of {String(totalExercises).padStart(2, '0')}
      </div>
      <h2 className="mt-3 font-serif text-4xl font-light text-ink leading-tight">
        {exercise.name}
      </h2>
      <div className="mt-3 font-mono text-sm tabular text-ink-dim">
        {exercise.sets} sets × {repText} · {restText} {tempoText}
      </div>

      {lastText ? (
        <div className="mt-5 border-l-2 border-crimson bg-surface-low px-4 py-3">
          <div className="label-md text-ink-faint">Last time</div>
          <div className="mt-1 font-mono tabular text-base text-ink">{lastText}</div>
        </div>
      ) : null}

      <div className="mt-7 flex-1">
        <div className="flex items-center gap-4 mb-4">
          <span className="label-md text-ink-faint">Form cues</span>
          <span className="hairline flex-1" />
        </div>
        <FormCueList cues={exercise.formCues} />
      </div>

      <div className="mt-7 space-y-3">
        <Button variant="primary" size="lg" className="w-full" onClick={onStart}>
          Start exercise
        </Button>
        <button
          onClick={onSkip}
          className="w-full label-md text-ink-faint hover:text-crimson py-2 transition-colors"
        >
          Skip exercise
        </button>
      </div>
    </div>
  );
}
