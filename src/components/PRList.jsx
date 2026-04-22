import { WORKOUT_META, WORKOUT_TYPES } from '../lib/workouts.js';
import { formatDateShort, formatMMSS } from '../lib/time.js';

function Row({ label, value, sub }) {
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-neutral-900 last:border-b-0">
      <div className="min-w-0 pr-3">
        <div className="text-sm text-neutral-200">{label}</div>
        {sub ? <div className="text-xs text-neutral-500 mt-0.5">{sub}</div> : null}
      </div>
      <div className="font-mono text-base text-green-500 shrink-0">{value}</div>
    </div>
  );
}

export default function PRList({ prs }) {
  const hasAny =
    prs.longestSkipInterval?.seconds > 0 ||
    WORKOUT_TYPES.some((t) => prs.mostRounds?.[t]?.count > 0) ||
    prs.longestStreak?.weeks > 0 ||
    prs.lowestEnduranceRpe != null;

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">
        Personal records
      </h2>
      {!hasAny ? (
        <p className="text-sm text-neutral-500 py-4 text-center">
          Log a few sessions to start setting records.
        </p>
      ) : (
        <div>
          {prs.longestSkipInterval?.seconds > 0 ? (
            <Row
              label="Longest continuous skip"
              value={formatMMSS(prs.longestSkipInterval.seconds)}
              sub={prs.longestSkipInterval.date ? formatDateShort(prs.longestSkipInterval.date) : null}
            />
          ) : null}

          {WORKOUT_TYPES.map((t) => {
            const entry = prs.mostRounds?.[t];
            if (!entry || !entry.count) return null;
            return (
              <Row
                key={t}
                label={`Most rounds · ${WORKOUT_META[t].name}`}
                value={entry.count}
                sub={entry.date ? formatDateShort(entry.date) : null}
              />
            );
          })}

          {prs.longestStreak?.weeks > 0 ? (
            <Row
              label="Longest weekly streak"
              value={`${prs.longestStreak.weeks} wk`}
              sub={prs.longestStreak.endedOn ? `ended ${formatDateShort(prs.longestStreak.endedOn)}` : 'current'}
            />
          ) : null}

          {prs.lowestEnduranceRpe ? (
            <Row
              label="Lowest RPE · Endurance"
              value={prs.lowestEnduranceRpe.rpe}
              sub={prs.lowestEnduranceRpe.date ? formatDateShort(prs.lowestEnduranceRpe.date) : null}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
