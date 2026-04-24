import { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export default function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix = '',
  inputMode = 'numeric',
  decimals = 0,
  ariaLabel,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const inputRef = useRef(null);

  function clamp(v) {
    if (Number.isNaN(v)) return value;
    if (v < min) return min;
    if (v > max) return max;
    return Number(v.toFixed(decimals));
  }

  function nudge(delta) {
    onChange(clamp((Number(value) || 0) + delta));
  }

  function startEditing() {
    setDraft(String(value ?? ''));
    setEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  function commit() {
    const n = parseFloat(draft);
    if (Number.isFinite(n)) onChange(clamp(n));
    setEditing(false);
  }

  const display = decimals > 0 ? Number(value ?? 0).toFixed(decimals) : String(value ?? 0);

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => nudge(-step)}
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease'}
        className="w-14 h-14 rounded border border-hairline-strong flex items-center justify-center text-ink-dim hover:text-crimson hover:border-crimson transition-colors focus:outline-none focus-visible:border-crimson"
      >
        <Minus size={20} strokeWidth={1.4} />
      </button>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode={inputMode}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9.\-]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-32 text-center font-serif font-light text-5xl tabular bg-transparent text-ink outline-none border-b border-crimson"
          aria-label={ariaLabel}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          aria-label={`${ariaLabel || 'Value'}: ${display}${suffix}`}
          className="w-32 text-center font-serif font-light text-5xl tabular text-ink hover:text-crimson focus:outline-none transition-colors"
        >
          {display}
          {suffix ? <span className="ml-2 font-mono uppercase tracking-widest text-sm text-ink-faint">{suffix}</span> : null}
        </button>
      )}
      <button
        type="button"
        onClick={() => nudge(step)}
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase'}
        className="w-14 h-14 rounded border border-hairline-strong flex items-center justify-center text-ink-dim hover:text-crimson hover:border-crimson transition-colors focus:outline-none focus-visible:border-crimson"
      >
        <Plus size={20} strokeWidth={1.4} />
      </button>
    </div>
  );
}
