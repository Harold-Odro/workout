import { format } from 'date-fns';
import { WORKOUT_META } from '../lib/workouts.js';
import { PPL_META } from '../lib/workoutsPPL.js';
import { formatDuration } from '../lib/time.js';

// ---------- small helpers ----------

function pad2(n) { return String(n ?? 0).padStart(2, '0'); }
function pad3(n) { return String(n ?? 0).padStart(3, '0'); }

function summariseSkipSet(set) {
  if (!set) return '—';
  if (set.left || set.right) {
    const l = set.left ? `${set.left.reps}×${set.left.weightKg}kg` : '—';
    const r = set.right ? `${set.right.reps}×${set.right.weightKg}kg` : '—';
    return `L ${l} · R ${r}`;
  }
  return `${set.reps ?? 0} × ${set.weightKg ?? 0}kg`;
}

function topSetForExercise(entry) {
  const completed = (entry.sets || []).filter((s) => s.completed);
  if (completed.length === 0) return null;
  if (completed[0].left || completed[0].right) {
    // unilateral: pick heaviest side
    let best = null;
    for (const s of completed) {
      for (const side of [s.left, s.right]) {
        if (!side) continue;
        const w = Number(side.weightKg) || 0;
        if (!best || w > best.weightKg) best = { reps: side.reps, weightKg: w };
      }
    }
    return best;
  }
  let best = completed[0];
  for (const s of completed) {
    if ((Number(s.weightKg) || 0) > (Number(best.weightKg) || 0)) best = s;
  }
  return { reps: best.reps, weightKg: best.weightKg };
}

function sumCompletedSets(exercises) {
  return (exercises || []).reduce(
    (a, e) => a + (e.sets || []).filter((s) => s.completed).length,
    0
  );
}

function totalVolumeKg(exercises) {
  let total = 0;
  for (const e of exercises || []) {
    for (const s of e.sets || []) {
      if (!s.completed) continue;
      if (s.left || s.right) {
        total += (Number(s.left?.reps) || 0) * (Number(s.left?.weightKg) || 0);
        total += (Number(s.right?.reps) || 0) * (Number(s.right?.weightKg) || 0);
      } else {
        total += (Number(s.reps) || 0) * (Number(s.weightKg) || 0);
      }
    }
  }
  return Math.round(total);
}

// Detect whether this session beat any prior session — returns a short label
// like "HEAVIEST BACK SQUAT" or "MOST ROUNDS" if so, else null. Uses only
// prior sessions (the draft has not been saved yet at this point).
export function findPR({ draft, priorSessions }) {
  const prior = (priorSessions || []).filter((s) => !s.skipped);

  if (draft.program === 'ppl' && draft.exercises?.length) {
    // Heaviest weight for any one exercise in this session vs. ever
    for (const e of draft.exercises) {
      const here = topSetForExercise(e);
      if (!here || !here.weightKg) continue;
      let priorMax = 0;
      for (const s of prior) {
        if (s.program !== 'ppl') continue;
        for (const pe of s.exercises || []) {
          if (pe.exerciseId !== e.exerciseId) continue;
          const top = topSetForExercise(pe);
          if (top && top.weightKg > priorMax) priorMax = top.weightKg;
        }
      }
      if (here.weightKg > priorMax) {
        return `Heaviest ${e.name}`;
      }
    }
    // Most sets in a session
    const sets = sumCompletedSets(draft.exercises);
    const priorTopSets = prior
      .filter((s) => s.program === 'ppl')
      .reduce((m, s) => Math.max(m, sumCompletedSets(s.exercises || [])), 0);
    if (sets > priorTopSets && sets >= 8) return 'Most sets';
    return null;
  }

  // skip: most rounds for this type
  if (draft.program === 'skip' || !draft.program) {
    const thisRounds = Number(draft.completedRounds) || 0;
    const priorTop = prior
      .filter((s) => (s.program || 'skip') === 'skip' && s.type === draft.type)
      .reduce((m, s) => Math.max(m, Number(s.completedRounds) || 0), 0);
    if (thisRounds > priorTop && thisRounds > 0) return `Most rounds · ${WORKOUT_META[draft.type]?.name || draft.type}`;
  }

  return null;
}

// ---------- component ----------

export default function SessionReceipt({ draft, priorSessions }) {
  const isPPL = draft.program === 'ppl';
  const meta = isPPL ? PPL_META[draft.type] : WORKOUT_META[draft.type];
  const dateObj = draft.startedAt ? new Date(draft.startedAt) : new Date();
  const edition = pad3((priorSessions?.length || 0) + 1);
  const prLabel = findPR({ draft, priorSessions });

  return (
    <div className="receipt receipt-drop" role="note" aria-label="Session receipt">
      <div className="receipt-perf-top" aria-hidden />

      {/* masthead */}
      <div className="flex items-center justify-between">
        <div className="receipt-eyebrow">Build&nbsp;At&nbsp;Home</div>
        <div className="receipt-eyebrow">№&nbsp;{edition}</div>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="font-serif text-2xl leading-none tracking-tight">
            {meta?.name || draft.type}
          </div>
          <div className="mt-1.5 receipt-eyebrow">
            {isPPL ? 'PPL · strength' : `Skip · LVL ${pad2(draft.level)}`}
          </div>
        </div>
        {prLabel ? (
          <span className="receipt-stamp stamp-press">
            ◆ New record
          </span>
        ) : null}
      </div>

      <div className="receipt-rule-double" />

      {/* ledger */}
      <div className="space-y-1.5">
        <Row label="Date">
          {format(dateObj, 'EEE, MMM d · yyyy').toUpperCase()}
        </Row>
        <Row label="Start">{format(dateObj, 'HH:mm')}</Row>
        <Row label="Duration">{formatDuration(draft.durationSeconds || 0)}</Row>
        {!isPPL && draft.plannedRounds != null ? (
          <Row label="Rounds">
            {pad2(draft.completedRounds)}&nbsp;/&nbsp;{pad2(draft.plannedRounds)}
          </Row>
        ) : null}
        {isPPL ? (
          <>
            <Row label="Sets logged">{pad2(sumCompletedSets(draft.exercises))}</Row>
            <Row label="Total volume">{totalVolumeKg(draft.exercises).toLocaleString()} kg</Row>
          </>
        ) : null}
      </div>

      <div className="receipt-rule" />

      {/* line items */}
      {isPPL && draft.exercises?.length > 0 ? (
        <>
          <div className="receipt-eyebrow mb-2">Line items</div>
          <div className="space-y-1">
            {draft.exercises.map((e) => {
              const top = topSetForExercise(e);
              const n = (e.sets || []).filter((s) => s.completed).length;
              return (
                <div key={e.exerciseId} className="receipt-row">
                  <div className="truncate">
                    <span className="opacity-60">{pad2(n)}×</span>&nbsp;{e.name}
                  </div>
                  <div className="font-semibold">
                    {top ? `${top.reps}×${top.weightKg}kg` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="receipt-rule" />
        </>
      ) : null}

      {/* footer */}
      <div className="flex items-center justify-between receipt-eyebrow">
        <span>Tear here</span>
        <span>End of ticket</span>
      </div>

      <div className="receipt-perf-bottom" aria-hidden />
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="receipt-row">
      <span className="opacity-60">{label}</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}
