export default function FormCueList({ cues, compact = false }) {
  if (!cues || cues.length === 0) return null;
  return (
    <ul className={compact ? 'space-y-1 text-xs text-neutral-400' : 'space-y-2 text-sm text-neutral-300'}>
      {cues.map((c, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-green-500 leading-5">·</span>
          <span className="flex-1">{c}</span>
        </li>
      ))}
    </ul>
  );
}
