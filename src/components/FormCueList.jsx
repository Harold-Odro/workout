export default function FormCueList({ cues, compact = false }) {
  if (!cues || cues.length === 0) return null;
  return (
    <ul className={compact ? 'space-y-1.5 text-[13px] text-ink-dim font-serif' : 'space-y-3 text-base text-ink-dim font-serif'}>
      {cues.map((c, i) => (
        <li key={i} className="flex gap-3">
          <span className="font-mono text-[10px] tabular tracking-[0.18em] text-crimson pt-1 shrink-0">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="flex-1">{c}</span>
        </li>
      ))}
    </ul>
  );
}
