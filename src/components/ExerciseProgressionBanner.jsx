import { getExerciseConfig, getExerciseDef } from '../lib/workoutsPPL.js';
import Button from './Button.jsx';

function describeCfg(cfg) {
  if (!cfg.targetReps) return `${cfg.sets} sets · ${cfg.targetRepsNote || 'AMRAP'} · ${cfg.restSeconds}s rest`;
  const [lo, hi] = cfg.targetReps;
  const range = lo === hi ? `${lo}` : `${lo}–${hi}`;
  return `${cfg.sets} × ${range} · ${cfg.restSeconds}s rest · ${cfg.tempo}`;
}

export default function ExerciseProgressionBanner({ suggestion, onAccept, onDismiss }) {
  if (!suggestion) return null;
  let exName = suggestion.exerciseId;
  try { exName = getExerciseDef(suggestion.exerciseId).name; } catch {}
  const nextCfg = getExerciseConfig(suggestion.exerciseId, suggestion.toLevel);

  return (
    <div className="mx-8 my-4 relative overflow-hidden bg-surface-low border border-outline-dim/50 px-6 py-6">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-0.75 bg-crimson-bright" />

      <div className="flex items-center justify-between gap-4">
        <span className="label-md text-crimson tracking-[0.2em]">
          ◆&nbsp;&nbsp;Progression
        </span>
        <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint">
          → LVL {String(suggestion.toLevel).padStart(2, '0')}
        </span>
      </div>

      <h3 className="mt-4 font-serif text-3xl font-light leading-tight text-ink">
        Advance <em className="italic text-crimson">{exName}</em>?
      </h3>

      <p className="mt-3 body-md text-ink-dim">
        Top of the range, four sessions running.
      </p>

      <div className="hairline mt-5" />

      <div className="mt-4">
        <div className="label-md text-ink-faint">Next prescription</div>
        <p className="mt-1.5 font-mono text-sm tabular text-ink-dim">{describeCfg(nextCfg)}</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => onAccept(suggestion)}>
          Advance
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDismiss(suggestion)}>
          Not yet
        </Button>
      </div>
    </div>
  );
}
