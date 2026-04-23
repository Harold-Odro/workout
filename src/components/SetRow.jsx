export default function SetRow({ index, set, highlight }) {
  if (!set || !set.completed) {
    return (
      <div className="flex items-center justify-between py-2 text-sm text-neutral-500">
        <span>Set {index + 1}</span>
        <span>—</span>
      </div>
    );
  }
  if (set.left || set.right) {
    return (
      <div className={[
        'flex items-center justify-between py-2 text-sm',
        highlight ? 'text-green-500' : 'text-neutral-200',
      ].join(' ')}>
        <span>Set {index + 1}</span>
        <span className="font-mono">
          L {set.left?.reps ?? '—'} × {set.left?.weightKg ?? 0}kg
          <span className="mx-2 text-neutral-600">|</span>
          R {set.right?.reps ?? '—'} × {set.right?.weightKg ?? 0}kg
        </span>
      </div>
    );
  }
  return (
    <div className={[
      'flex items-center justify-between py-2 text-sm',
      highlight ? 'text-green-500' : 'text-neutral-200',
    ].join(' ')}>
      <span>Set {index + 1}</span>
      <span className="font-mono">
        {set.reps ?? 0} × {set.weightKg ?? 0}kg
        {typeof set.rpe === 'number' && set.rpe > 0 ? (
          <span className="ml-2 text-neutral-500">RPE {set.rpe}</span>
        ) : null}
      </span>
    </div>
  );
}
