const PROGRAMS = [
  { id: 'skip', label: 'Skip' },
  { id: 'ppl', label: 'PPL' },
];

export default function ProgramSwitcher({ value, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Active program"
      className="inline-flex items-center gap-1"
    >
      {PROGRAMS.map((p, i) => {
        const active = value === p.id;
        return (
          <div key={p.id} className="flex items-center">
            {i > 0 && <span className="mx-2 text-ink-faint/40">·</span>}
            <button
              role="tab"
              aria-selected={active}
              onClick={() => onChange(p.id)}
              className={[
                'relative font-serif text-base tracking-tight px-1 py-1.5 transition-colors',
                'focus:outline-none focus-visible:text-crimson',
                active ? 'text-crimson' : 'text-ink-faint hover:text-ink',
              ].join(' ')}
            >
              {p.label}
              <span
                aria-hidden
                className={[
                  'absolute left-0 right-0 -bottom-0.5 h-px origin-left transition-transform duration-500',
                  active ? 'bg-crimson-bright scale-x-100' : 'bg-transparent scale-x-0',
                ].join(' ')}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
