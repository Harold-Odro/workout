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
      className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1"
    >
      {sets.map((set, i) => {
        if (!set?.completed) return null;
        const isUnilateral = set.left || set.right;
        return (
          <div
            key={i}
            role="listitem"
            className="shrink-0 border-l-2 border-crimson bg-surface-low px-3 py-2"
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-crimson tabular">
              Set&nbsp;{String(i + 1).padStart(2, '0')}
            </div>
            <div className="mt-1 font-mono text-[12px] tabular text-ink">
              {isUnilateral ? unilateralLabel(set) : `${set.reps} × ${set.weightKg}kg`}
              {typeof set.rpe === 'number' && set.rpe > 0 ? (
                <span className="ml-2 text-ink-faint">@{set.rpe}</span>
              ) : null}
            </div>
          </div>
        );
      })}
      {totalSets > sets.length ? (
        Array.from({ length: totalSets - sets.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            aria-hidden
            className="shrink-0 w-20 border-l-2 border-hairline-strong px-3 py-2"
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint/60 tabular">
              Set&nbsp;{String(sets.length + i + 1).padStart(2, '0')}
            </div>
            <div className="mt-1 font-mono text-ink-faint/40 text-[12px]">—</div>
          </div>
        ))
      ) : null}
    </div>
  );
}
