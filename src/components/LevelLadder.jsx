import { Check, Lock } from 'lucide-react';
import { LEVELS, MAX_LEVEL, WORKOUT_META, describeLevel, estimatedMinutes } from '../lib/workouts.js';
import { countSuccessfulAtLevel, PROGRESSION_RULES } from '../lib/progression.js';

function Rung({ type, level, currentLevel, successfulCount, onSelect }) {
  const isCurrent = level === currentLevel;
  const isPast = level < currentLevel;
  const isFuture = level > currentLevel;

  return (
    <button
      type="button"
      onClick={() => onSelect(level)}
      className={[
        'w-full text-left rounded-xl border px-4 py-3 flex items-center gap-3',
        'transition-colors',
        isCurrent
          ? 'border-green-500/60 bg-green-500/10'
          : isPast
          ? 'border-neutral-800 bg-neutral-900/60'
          : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600',
      ].join(' ')}
    >
      <div
        className={[
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-sm',
          isCurrent
            ? 'bg-green-500 text-neutral-950'
            : isPast
            ? 'bg-neutral-800 text-neutral-400'
            : 'bg-neutral-800 text-neutral-500',
        ].join(' ')}
        aria-hidden
      >
        {isPast ? <Check size={14} /> : isFuture ? <Lock size={12} /> : level}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-neutral-100">Level {level}</span>
          <span className="text-xs text-neutral-500">~{estimatedMinutes(type, level)} min</span>
        </div>
        <div className="mt-0.5 text-xs text-neutral-400">{describeLevel(type, level)}</div>
        {isCurrent ? (
          <div className="mt-1 text-xs text-green-500">
            {successfulCount}/{PROGRESSION_RULES.sessionsRequired} sessions logged
            {level < MAX_LEVEL ? ' before next level' : ''}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function LevelLadder({ type, sessions, currentLevel, onSelectLevel }) {
  const meta = WORKOUT_META[type];
  const ladder = LEVELS[type];
  const successfulCount = countSuccessfulAtLevel(sessions, type, currentLevel);

  return (
    <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold text-neutral-100">{meta.name}</h2>
        <span className="text-xs font-mono text-green-500">L{currentLevel}</span>
      </div>
      <div className="space-y-2">
        {ladder.map((r) => (
          <Rung
            key={r.level}
            type={type}
            level={r.level}
            currentLevel={currentLevel}
            successfulCount={successfulCount}
            onSelect={onSelectLevel}
          />
        ))}
      </div>
    </section>
  );
}
