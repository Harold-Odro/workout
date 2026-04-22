import { WORKOUT_META } from '../lib/workouts.js';
import { formatDateShort, formatDuration } from '../lib/time.js';

export default function SessionListItem({ session }) {
  const meta = WORKOUT_META[session.type];
  return (
    <div className="flex items-center gap-3 py-3 border-b border-neutral-900 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-neutral-100 truncate">
          {meta?.name || session.type}
        </div>
        <div className="text-xs text-neutral-500">
          {formatDateShort(session.date)} · {formatDuration(session.durationSeconds)}
        </div>
      </div>
      <div className="text-xs font-mono px-2 py-1 rounded-md bg-neutral-800 text-neutral-300">
        RPE {session.rpe}
      </div>
    </div>
  );
}
