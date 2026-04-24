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
        'group w-full text-left px-4 py-4 flex items-center gap-4 transition-colors',
        isCurrent
          ? 'bg-surface-low border-l-2 border-crimson-bright'
          : 'bg-surface-1 border-l-2 border-transparent hover:bg-surface-high',
      ].join(' ')}
    >
      <div
        className={[
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-mono tabular text-xs',
          isCurrent
            ? 'bg-crimson-bright text-white'
            : isPast
            ? 'bg-surface-high text-ink-dim'
            : 'border border-hairline-strong text-ink-faint',
        ].join(' ')}
        aria-hidden
      >
        {isPast ? <Check size={14} strokeWidth={2} /> : isFuture ? <Lock size={12} strokeWidth={1.6} /> : String(level).padStart(2, '0')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-lg text-ink leading-none">Level {level}</span>
          <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint">
            ~{estimatedMinutes(type, level)}&nbsp;MIN
          </span>
        </div>
        <div className="mt-1.5 body-md text-ink-dim leading-snug">{describeLevel(type, level)}</div>
        {isCurrent ? (
          <div className="mt-2 label-md text-crimson tabular">
            {successfulCount}/{PROGRESSION_RULES.sessionsRequired}&nbsp;sessions
            {level < MAX_LEVEL ? ' · before promotion' : ''}
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
    <section className="tonal p-6">
      <div className="eyebrow">
        <h2>{meta.name}</h2>
        <span className="meta">LVL&nbsp;{String(currentLevel).padStart(2, '0')}</span>
      </div>
      <div className="hairline mb-4" />
      <div className="space-y-px bg-hairline">
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
