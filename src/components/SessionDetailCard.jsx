import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-neutral-900 border border-neutral-800',
        'hover:border-green-500/40 transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
      ].join(' ')}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-100 truncate">
            {meta?.name || session.type}
          </span>
          <span
            className={[
              'text-[10px] font-mono uppercase px-1.5 py-0.5 rounded',
              isPPL ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400',
            ].join(' ')}
          >
            {isPPL ? 'PPL' : 'skip'}
          </span>
          {session.skipped ? (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">
              skipped
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 text-xs text-neutral-500">{detailLine(session)}</div>
      </div>
      {session.rpe ? (
        <div className="text-xs font-mono px-2 py-1 rounded-md bg-neutral-800 text-neutral-300">
          RPE {session.rpe}
        </div>
      ) : null}
      <ChevronRight size={18} className="text-neutral-600" aria-hidden />
    </Link>
  );
}
