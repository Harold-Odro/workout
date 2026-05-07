// 7-day calendar dots — last 7 days, today on the right.
// Held = solid crimson. Missed = faint hairline. Rest = empty hairline ring.
// Today held = solid filled square. Today pending = pulsing crimson outline.

const STATUS_CLASSES = {
  held:           'bg-crimson border-crimson',
  missed:         'bg-transparent border-hairline',
  rest:           'bg-transparent border-hairline-strong/40',
  'today-held':   'bg-crimson-bright border-crimson-bright',
  'today-pending':'bg-transparent border-crimson-bright heartbeat',
};

const STATUS_LABEL = {
  held: 'held',
  missed: 'missed',
  rest: 'rest day',
  'today-held': 'held today',
  'today-pending': 'today, pending',
};

export default function RecentDotRow({ dots }) {
  return (
    <div
      className="flex items-end justify-between gap-2"
      role="list"
      aria-label="Last seven days"
    >
      {dots.map((d, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1.5"
          role="listitem"
          aria-label={`${d.dayLetter} — ${STATUS_LABEL[d.status]}`}
        >
          <span
            className={`block w-3 h-3 border ${STATUS_CLASSES[d.status]}`}
            style={{ borderRadius: 1 }}
            aria-hidden
          />
          <span
            className={`font-mono text-[10px] tabular tracking-widest ${
              d.status === 'today-held' || d.status === 'today-pending'
                ? 'text-crimson'
                : 'text-ink-faint'
            }`}
          >
            {d.dayLetter}
          </span>
        </div>
      ))}
    </div>
  );
}
