export default function SetRow({ index, set, highlight }) {
  const num = String(index + 1).padStart(2, '0');
  if (!set || !set.completed) {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-hairline last:border-b-0">
        <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint/70 uppercase">Set&nbsp;{num}</span>
        <span className="font-mono text-ink-faint/50">—</span>
      </div>
    );
  }
  const valueClass = [
    'font-mono text-sm tabular',
    highlight ? 'text-crimson' : 'text-ink-dim',
  ].join(' ');
  if (set.left || set.right) {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-hairline last:border-b-0">
        <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint uppercase">Set&nbsp;{num}</span>
        <span className={valueClass}>
          L {set.left?.reps ?? '—'} × {set.left?.weightKg ?? 0}kg
          <span className="mx-2 text-ink-faint/40">|</span>
          R {set.right?.reps ?? '—'} × {set.right?.weightKg ?? 0}kg
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-hairline last:border-b-0">
      <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint uppercase">Set&nbsp;{num}</span>
      <span className={valueClass}>
        {set.reps ?? 0} × {set.weightKg ?? 0}kg
        {typeof set.rpe === 'number' && set.rpe > 0 ? (
          <span className="ml-2 text-ink-faint">RPE {set.rpe}</span>
        ) : null}
      </span>
    </div>
  );
}
