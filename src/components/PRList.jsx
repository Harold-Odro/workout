import { WORKOUT_META, WORKOUT_TYPES } from '../lib/workouts.js';
import { formatDateShort, formatMMSS } from '../lib/time.js';

function Row({ label, value, sub }) {
  return (
    <div className="flex items-baseline justify-between py-4 border-b border-hairline last:border-b-0">
      <div className="min-w-0 pr-3">
        <div className="font-serif text-base text-ink leading-tight">{label}</div>
        {sub ? <div className="label-md text-ink-faint mt-1.5 tabular">{sub}</div> : null}
      </div>
      <div className="font-mono tabular text-xl text-crimson shrink-0 leading-none">{value}</div>
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
    <div className="tonal p-6">
      <div className="eyebrow">
        <h2>Personal records</h2>
        <span className="meta">All&nbsp;time</span>
      </div>
      <div className="hairline mb-2" />

      {!hasAny ? (
        <p className="font-serif italic text-ink-dim text-center py-6">
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
