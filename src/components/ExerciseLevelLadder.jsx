import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import {
  getExerciseConfig,
  getExerciseLevels,
  MAX_PPL_LEVEL,
} from '../lib/workoutsPPL.js';
import {
  consecutiveSuccesses,
  PPL_PROGRESSION_RULES,
} from '../lib/progressionPPL.js';

function describeCfg(cfg) {
  if (!cfg.targetReps) return `${cfg.sets} sets · ${cfg.targetRepsNote || 'AMRAP'} · ${cfg.restSeconds}s rest`;
  const [lo, hi] = cfg.targetReps;
  const range = lo === hi ? `${lo}` : `${lo}–${hi}`;
  const note = cfg.unilateralNote ? ` ${cfg.unilateralNote}` : '';
  return `${cfg.sets} × ${range}${note} · ${cfg.restSeconds}s rest · ${cfg.tempo}`;
}

export default function ExerciseLevelLadder({
  exercise,
  currentLevel,
  sessions,
  onSelectLevel,
}) {
  const [open, setOpen] = useState(false);
  const ladder = getExerciseLevels(exercise.id) || [];
  const count = consecutiveSuccesses(sessions, exercise.id, currentLevel);
  const currentCfg = getExerciseConfig(exercise.id, currentLevel);

  return (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-xl"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-neutral-100 truncate">
              {exercise.name}
            </span>
            <span className="text-xs font-mono text-green-500 shrink-0">L{currentLevel}</span>
          </div>
          <div className="mt-0.5 text-xs text-neutral-500 truncate">{describeCfg(currentCfg)}</div>
          {currentLevel < MAX_PPL_LEVEL ? (
            <div className="mt-1 text-xs text-green-500">
              {count}/{PPL_PROGRESSION_RULES.sessionsRequired} successes to progress
            </div>
          ) : (
            <div className="mt-1 text-xs text-neutral-500">Max level</div>
          )}
        </div>
        {open ? (
          <ChevronUp size={18} className="text-neutral-500 shrink-0 ml-2" />
        ) : (
          <ChevronDown size={18} className="text-neutral-500 shrink-0 ml-2" />
        )}
      </button>
      {open ? (
        <div className="px-3 pb-3 space-y-2">
          {ladder.map((cfg) => {
            const isCurrent = cfg.level === currentLevel;
            const isPast = cfg.level < currentLevel;
            const isFuture = cfg.level > currentLevel;
            return (
              <button
                key={cfg.level}
                type="button"
                onClick={() => onSelectLevel(cfg.level)}
                className={[
                  'w-full text-left rounded-lg border px-3 py-2 flex items-center gap-3',
                  isCurrent
                    ? 'border-green-500/60 bg-green-500/10'
                    : isPast
                    ? 'border-neutral-800 bg-neutral-900/60'
                    : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-xs',
                    isCurrent
                      ? 'bg-green-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-500',
                  ].join(' ')}
                  aria-hidden
                >
                  {isPast ? <Check size={12} /> : isFuture ? <Lock size={10} /> : cfg.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-100">Level {cfg.level}</div>
                  <div className="text-[11px] text-neutral-400 truncate">{describeCfg(cfg)}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
