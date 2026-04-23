import { TrendingUp } from 'lucide-react';
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
    <div className="mx-5 mb-4 rounded-2xl bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/40 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <TrendingUp size={18} className="text-green-400" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-neutral-100">
            Ready to progress {exName}?
          </h3>
          <p className="mt-1 text-sm text-neutral-300">
            You've hit the top of the range 4 sessions in a row.
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Level {suggestion.toLevel}: {describeCfg(nextCfg)}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="sm" onClick={() => onAccept(suggestion)}>
              Level up
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDismiss(suggestion)}>
              Not yet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
