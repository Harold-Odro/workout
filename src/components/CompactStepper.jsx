import { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export default function CompactStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix = '',
  decimals = 0,
  inputMode = 'numeric',
  ariaLabel,
  accent = 'text-ink',
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  function clamp(v) {
    if (!Number.isFinite(v)) return value;
    const n = Math.max(min, Math.min(max, v));
    return Number(n.toFixed(decimals));
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
    <div className="flex items-stretch overflow-hidden rounded border border-hairline-strong bg-surface-low focus-within:border-crimson transition-colors">
      <button
        type="button"
        onClick={() => nudge(-step)}
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease'}
        className="w-14 flex items-center justify-center text-ink-faint hover:text-crimson transition-colors active:bg-surface-high focus:outline-none focus-visible:bg-surface-high"
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
          className={[
            'flex-1 text-center font-serif font-light text-4xl tabular bg-transparent outline-none',
            accent,
          ].join(' ')}
          aria-label={ariaLabel}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          aria-label={`${ariaLabel || 'Value'}: ${display}${suffix}. Tap to edit.`}
          className={[
            'flex-1 flex items-baseline justify-center gap-1 font-serif font-light text-4xl tabular py-3',
            accent,
            'focus:outline-none',
          ].join(' ')}
        >
          <span>{display}</span>
          {suffix ? <span className="text-sm text-ink-faint font-mono uppercase tracking-widest">{suffix}</span> : null}
        </button>
      )}
      <button
        type="button"
        onClick={() => nudge(step)}
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase'}
        className="w-14 flex items-center justify-center text-ink-faint hover:text-crimson transition-colors active:bg-surface-high focus:outline-none focus-visible:bg-surface-high"
      >
        <Plus size={20} strokeWidth={1.4} />
      </button>
    </div>
  );
}
