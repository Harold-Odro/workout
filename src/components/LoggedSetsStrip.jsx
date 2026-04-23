// Horizontal strip of already-logged sets for the current exercise.
// Shown above the inputs so the user can glance at what they just did.

function unilateralLabel(set) {
  const l = set.left ? `L ${set.left.reps}×${set.left.weightKg}` : null;
  const r = set.right ? `R ${set.right.reps}×${set.right.weightKg}` : null;
  return [l, r].filter(Boolean).join(' · ');
}

export default function LoggedSetsStrip({ sets, totalSets }) {
  if (!sets || sets.length === 0) return null;
  return (
    <div
      role="list"
      aria-label="Logged sets"
      className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1"
    >
      {sets.map((set, i) => {
        if (!set?.completed) return null;
        const isUnilateral = set.left || set.right;
        return (
          <div
            key={i}
            role="listitem"
            className={[
              'shrink-0 rounded-lg border border-green-500/30 bg-green-500/5 px-2.5 py-1.5',
              'text-[11px] font-mono text-neutral-200',
            ].join(' ')}
          >
            <div className="text-[9px] uppercase tracking-widest text-green-500">
              Set {i + 1}
            </div>
            <div className="mt-0.5">
              {isUnilateral ? unilateralLabel(set) : `${set.reps} × ${set.weightKg}kg`}
              {typeof set.rpe === 'number' && set.rpe > 0 ? (
                <span className="ml-2 text-neutral-500">@{set.rpe}</span>
              ) : null}
            </div>
          </div>
        );
      })}
      {/* Placeholders for sets still ahead */}
      {totalSets > sets.length ? (
        Array.from({ length: totalSets - sets.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            aria-hidden
            className="shrink-0 w-[78px] rounded-lg border border-dashed border-neutral-800 px-2.5 py-1.5"
          >
            <div className="text-[9px] uppercase tracking-widest text-neutral-700">
              Set {sets.length + i + 1}
            </div>
            <div className="mt-0.5 font-mono text-neutral-700 text-[11px]">—</div>
          </div>
        ))
      ) : null}
    </div>
  );
}
