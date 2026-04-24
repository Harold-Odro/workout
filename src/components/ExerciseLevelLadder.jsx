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
    <div className="bg-surface-1 border border-hairline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-crimson"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-lg text-ink truncate leading-none">
              {exercise.name}
            </span>
            <span className="font-mono text-[10px] tabular tracking-[0.18em] text-crimson shrink-0">
              LVL&nbsp;{String(currentLevel).padStart(2, '0')}
            </span>
          </div>
          <div className="mt-1.5 font-mono text-[12px] tabular text-ink-faint truncate">{describeCfg(currentCfg)}</div>
          {currentLevel < MAX_PPL_LEVEL ? (
            <div className="mt-2 label-md text-crimson tabular">
              {count}/{PPL_PROGRESSION_RULES.sessionsRequired}&nbsp;successes&nbsp;·&nbsp;to progress
            </div>
          ) : (
            <div className="mt-2 label-md text-ink-faint">Max level</div>
          )}
        </div>
        {open ? (
          <ChevronUp size={16} strokeWidth={1.4} className="text-ink-faint shrink-0 ml-3" />
        ) : (
          <ChevronDown size={16} strokeWidth={1.4} className="text-ink-faint shrink-0 ml-3" />
        )}
      </button>
      {open ? (
        <div className="px-3 pb-3 space-y-px bg-hairline border-t border-hairline">
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
                  'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors',
                  isCurrent
                    ? 'bg-surface-low border-l-2 border-crimson-bright'
                    : 'bg-surface-1 border-l-2 border-transparent hover:bg-surface-high',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono tabular text-[10px]',
                    isCurrent
                      ? 'bg-crimson-bright text-white'
                      : isPast
                      ? 'bg-surface-high text-ink-dim'
                      : 'border border-hairline-strong text-ink-faint',
                  ].join(' ')}
                  aria-hidden
                >
                  {isPast ? <Check size={12} strokeWidth={2} /> : isFuture ? <Lock size={10} strokeWidth={1.6} /> : String(cfg.level).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-base text-ink leading-none">Level {cfg.level}</div>
                  <div className="mt-1 font-mono text-[11px] tabular text-ink-faint truncate">{describeCfg(cfg)}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
