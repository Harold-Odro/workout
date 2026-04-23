import { WORKOUT_META } from '../lib/workouts.js';
import { PPL_META } from '../lib/workoutsPPL.js';
import { formatDateShort, formatDuration } from '../lib/time.js';

function metaForSession(session) {
  if (session.program === 'ppl') return PPL_META[session.type];
  return WORKOUT_META[session.type];
}

export default function SessionListItem({ session, index }) {
  const meta = metaForSession(session);
  const isPPL = session.program === 'ppl';
  const num = index != null ? String(index).padStart(2, '0') : null;

  return (
    <li className="flex items-center gap-5 bg-surface-1 px-5 py-4 hover:bg-surface-high transition-colors">
      {num && (
        <span className="font-mono text-[10px] tabular tracking-[0.2em] text-ink-faint w-6 shrink-0">
          {num}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-lg text-ink leading-tight truncate">
            {meta?.name || session.type}
          </span>
          <span
            className={[
              'font-mono text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-sm',
              isPPL
                ? 'bg-surface-high text-ink-dim'
                : 'bg-crimson-blood/40 text-crimson',
            ].join(' ')}
          >
            {isPPL ? 'PPL' : 'SKIP'}
          </span>
        </div>
        <div className="mt-1 label-md text-ink-faint">
          <span className="tabular">{formatDateShort(session.date)}</span>
          <span className="mx-2 opacity-50">/</span>
          <span className="tabular">{formatDuration(session.durationSeconds)}</span>
        </div>
      </div>

      {session.rpe ? (
        <div className="text-right">
          <div className="label-md text-ink-faint">RPE</div>
          <div className="font-mono tabular text-xl text-crimson leading-none mt-0.5">
            {session.rpe}
          </div>
        </div>
      ) : null}
    </li>
  );
}
