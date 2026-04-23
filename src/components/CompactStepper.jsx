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
  accent = 'text-neutral-100',
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
    <div className="flex items-stretch overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
      <button
        type="button"
        onClick={() => nudge(-step)}
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease'}
        className="w-14 flex items-center justify-center text-neutral-300 bg-neutral-900 active:bg-neutral-800 focus:outline-none focus-visible:bg-neutral-800"
      >
        <Minus size={22} />
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
            'flex-1 text-center font-mono font-bold text-4xl bg-transparent outline-none',
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
            'flex-1 flex items-baseline justify-center gap-1 font-mono font-bold text-4xl py-3',
            accent,
            'focus:outline-none',
          ].join(' ')}
        >
          <span>{display}</span>
          {suffix ? <span className="text-base text-neutral-500 font-semibold">{suffix}</span> : null}
        </button>
      )}
      <button
        type="button"
        onClick={() => nudge(step)}
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase'}
        className="w-14 flex items-center justify-center text-neutral-300 bg-neutral-900 active:bg-neutral-800 focus:outline-none focus-visible:bg-neutral-800"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
