const PROGRAMS = [
  { id: 'skip', label: 'Skip' },
  { id: 'ppl', label: 'PPL' },
];

export default function ProgramSwitcher({ value, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Active program"
      className="inline-flex rounded-full bg-neutral-900 border border-neutral-800 p-1"
    >
      {PROGRAMS.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p.id)}
            className={[
              'px-4 min-h-10 text-sm font-medium rounded-full transition-colors',
              active
                ? 'bg-green-500 text-neutral-950'
                : 'text-neutral-400 hover:text-neutral-200',
            ].join(' ')}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
