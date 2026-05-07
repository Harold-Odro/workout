// Small progress ring for the masthead: sessions this week vs. target, with
// the streak as a quieter secondary line. Intentionally tiny — it's context,
// not a trophy case.

export default function WeeklyTargetRing({ progress, size = 64 }) {
  const { completed, target, percent } = progress;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, percent)));
  const hit = completed >= target;

  return (
    <div className="flex items-center gap-3" aria-label={`This week ${completed} of ${target} sessions`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--color-crimson-bright)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="butt"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="progress-ring-fg"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif font-light text-xl tabular text-ink leading-none">
            {completed}
            <span className="text-ink-faint">/</span>
            {target}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="label-md text-ink-faint">This week</div>
        <div className="mt-1 font-serif italic text-sm text-ink-dim leading-tight">
          {hit
            ? 'Target reached.'
            : completed === 0
            ? 'The page is blank.'
            : `${target - completed} to go.`}
        </div>
      </div>
    </div>
  );
}
