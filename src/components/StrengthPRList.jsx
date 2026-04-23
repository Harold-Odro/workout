import { computeStrengthPRs } from '../lib/analyticsPPL.js';
import { formatDateShort } from '../lib/time.js';

function Row({ label, value, sub }) {
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-neutral-900 last:border-b-0">
      <div className="min-w-0 pr-3">
        <div className="text-sm text-neutral-200 truncate">{label}</div>
        {sub ? <div className="text-xs text-neutral-500 mt-0.5">{sub}</div> : null}
      </div>
      <div className="font-mono text-base text-green-500 shrink-0">{value}</div>
    </div>
  );
}

export default function StrengthPRList({ sessions }) {
  const { heaviest, bestVolume, mostSetsSession } = computeStrengthPRs(sessions);
  const heaviestIds = Object.keys(heaviest);
  const hasAny =
    heaviestIds.length > 0 ||
    Object.keys(bestVolume).length > 0 ||
    mostSetsSession;

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">
        Strength records
      </h2>
      {!hasAny ? (
        <p className="text-sm text-neutral-500 py-4 text-center">
          Log PPL sessions to start setting strength records.
        </p>
      ) : (
        <div>
          {heaviestIds.map((id) => {
            const h = heaviest[id];
            const v = bestVolume[id];
            const label = h.name || id;
            const sub = h.date ? formatDateShort(h.date) : '';
            return (
              <Row
                key={id}
                label={`${label} · heaviest`}
                value={`${h.weightKg}kg × ${h.reps}`}
                sub={
                  v && (v.reps !== h.reps || v.weightKg !== h.weightKg)
                    ? `${sub} · best vol ${v.reps}×${v.weightKg}kg (${formatDateShort(v.date)})`
                    : sub
                }
              />
            );
          })}
          {mostSetsSession ? (
            <Row
              label="Most sets in a session"
              value={mostSetsSession.count}
              sub={`${mostSetsSession.type} · ${formatDateShort(mostSetsSession.date)}`}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
