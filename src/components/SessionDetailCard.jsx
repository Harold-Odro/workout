import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { WORKOUT_META } from '../lib/workouts.js';
import { PPL_META } from '../lib/workoutsPPL.js';
import { formatDateShort, formatDuration } from '../lib/time.js';

function metaFor(session) {
  if (session.program === 'ppl') return PPL_META[session.type];
  return WORKOUT_META[session.type];
}

function detailLine(session) {
  if (session.program === 'ppl') {
    const sets = (session.exercises || []).reduce(
      (a, e) => a + (e.sets || []).filter((s) => s.completed).length,
      0
    );
    return `${formatDateShort(session.date)} · ${formatDuration(session.durationSeconds)} · ${sets} sets`;
  }
  return `${formatDateShort(session.date)} · ${formatDuration(session.durationSeconds)} · ${session.completedRounds}/${session.plannedRounds} rounds`;
}

export default function SessionDetailCard({ session }) {
  const meta = metaFor(session);
  const isPPL = session.program === 'ppl';
  return (
    <Link
      to={`/session/${session.id}`}
      className="group flex items-center gap-4 px-5 py-4 bg-surface-1 hover:bg-surface-high transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-crimson"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-serif text-lg text-ink truncate leading-tight">
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
          {session.skipped ? (
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-sm bg-surface-high text-ink-faint">
              SKIPPED
            </span>
          ) : null}
        </div>
        <div className="mt-1 label-md text-ink-faint tabular">{detailLine(session)}</div>
      </div>
      {session.rpe ? (
        <div className="text-right">
          <div className="label-md text-ink-faint">RPE</div>
          <div className="font-mono tabular text-lg text-crimson leading-none mt-0.5">
            {session.rpe}
          </div>
        </div>
      ) : null}
      <ArrowUpRight size={18} strokeWidth={1.4} className="text-ink-faint group-hover:text-crimson transition-colors" aria-hidden />
    </Link>
  );
}
