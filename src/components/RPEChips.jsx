export default function RPEChips({ value, onChange, label = 'Per-set RPE' }) {
  const options = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] uppercase tracking-widest text-neutral-500">{label}</span>
        <span className="text-xs text-neutral-500">
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
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? 0 : n)}
              className={[
                'h-8 rounded-md text-xs font-mono font-semibold transition-colors',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-green-500',
                active
                  ? 'bg-green-500 text-neutral-950'
                  : n > 7
                  ? 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
                  : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:bg-neutral-800',
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
