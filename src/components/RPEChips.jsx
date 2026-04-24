export default function RPEChips({ value, onChange, label = 'Per-set RPE' }) {
  const options = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="label-md text-ink-faint">{label}</span>
        <span className="font-serif italic text-sm text-ink-dim">
          {value ? intensityWord(value) : 'optional'}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-10 gap-1"
      >
        {options.map((n) => {
          const active = value === n;
          const intense = n > 7;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? 0 : n)}
              className={[
                'h-10 rounded-sm font-mono text-xs font-semibold tabular transition-all',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-crimson',
                active
                  ? 'bg-crimson-bright text-white border border-transparent'
                  : intense
                  ? 'bg-transparent text-ink-dim border border-hairline-strong hover:border-crimson hover:text-crimson'
                  : 'bg-transparent text-ink-faint border border-hairline hover:border-hairline-strong hover:text-ink',
              ].join(' ')}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function intensityWord(v) {
  if (v <= 2) return 'Easy';
  if (v <= 4) return 'Light';
  if (v <= 6) return 'Moderate';
  if (v <= 8) return 'Hard';
  if (v <= 9) return 'Very hard';
  return 'Max';
}
