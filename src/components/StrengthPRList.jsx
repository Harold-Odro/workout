import { computeStrengthPRs } from '../lib/analyticsPPL.js';
import { formatDateShort } from '../lib/time.js';

function Row({ label, value, sub }) {
  return (
    <div className="flex items-baseline justify-between py-4 border-b border-hairline last:border-b-0">
      <div className="min-w-0 pr-3">
        <div className="font-serif text-base text-ink truncate leading-tight">{label}</div>
        {sub ? <div className="label-md text-ink-faint mt-1.5 tabular">{sub}</div> : null}
      </div>
      <div className="font-mono tabular text-xl text-crimson shrink-0 leading-none">{value}</div>
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
    <div className="tonal p-6">
      <div className="eyebrow">
        <h2>Strength records</h2>
        <span className="meta">All&nbsp;time</span>
      </div>
      <div className="hairline mb-2" />

      {!hasAny ? (
        <p className="font-serif italic text-ink-dim text-center py-6">
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
