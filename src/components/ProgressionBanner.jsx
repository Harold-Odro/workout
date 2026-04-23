import { WORKOUT_META, describeLevel } from '../lib/workouts.js';
import Button from './Button.jsx';

export default function ProgressionBanner({ suggestion, onAccept, onDismiss }) {
  if (!suggestion) return null;
  const meta = WORKOUT_META[suggestion.type];
  const nextDesc = describeLevel(suggestion.type, suggestion.toLevel);

  return (
    <div className="mx-8 my-4 relative overflow-hidden bg-surface-low border border-outline-dim/50 px-6 py-6">
      {/* crimson edge */}
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-0.75 bg-crimson-bright" />

      <div className="flex items-center justify-between gap-4">
        <span className="label-md text-crimson tracking-[0.2em]">
          ◆&nbsp;&nbsp;Ascension
        </span>
        <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint">
          LVL {String(suggestion.fromLevel).padStart(2, '0')} →{' '}
          <span className="text-crimson">LVL {String(suggestion.toLevel).padStart(2, '0')}</span>
        </span>
      </div>

      <h3 className="mt-4 font-serif text-3xl font-light leading-tight text-ink">
        Ready to <em className="italic text-crimson">level up</em>?
      </h3>

      <p className="mt-3 body-md text-ink-dim">
        You've completed <span className="text-ink">{meta?.name}</span> Level{' '}
        <span className="font-mono tabular">{suggestion.fromLevel}</span>{' '}
        <span className="font-mono tabular">{suggestion.successfulCount ?? 4}</span>{' '}
        times in a row.
      </p>

      <div className="hairline mt-5" />

      <div className="mt-4">
        <div className="label-md text-ink-faint">Next chapter</div>
        <p className="mt-1.5 font-serif italic text-lg text-ink-dim">{nextDesc}</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => onAccept(suggestion)}>
          Ascend
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDismiss(suggestion)}>
          Not yet
        </Button>
      </div>
    </div>
  );
}
