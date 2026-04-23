import { WORKOUT_META } from '../lib/workouts.js';
import { PPL_META } from '../lib/workoutsPPL.js';
import { formatDateShort, formatDuration } from '../lib/time.js';

function metaForSession(session) {
  if (session.program === 'ppl') return PPL_META[session.type];
  return WORKOUT_META[session.type];
}

export default function SessionListItem({ session }) {
  const meta = metaForSession(session);
  const isPPL = session.program === 'ppl';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-neutral-900 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-100 truncate">
            {meta?.name || session.type}
          </span>
          <span className={[
            'text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded',
            isPPL ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400',
          ].join(' ')}>
            {isPPL ? 'PPL' : 'skip'}
          </span>
        </div>
        <div className="text-xs text-neutral-500">
          {formatDateShort(session.date)} · {formatDuration(session.durationSeconds)}
        </div>
      </div>
      {session.rpe ? (
        <div className="text-xs font-mono px-2 py-1 rounded-md bg-neutral-800 text-neutral-300">
          RPE {session.rpe}
        </div>
      ) : null}
    </div>
  );
}
