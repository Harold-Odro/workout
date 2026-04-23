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
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => nudge(-step)}
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease'}
        className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-200 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
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
          className="w-28 text-center font-mono font-bold text-4xl bg-transparent text-neutral-100 outline-none border-b-2 border-green-500"
          aria-label={ariaLabel}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          aria-label={`${ariaLabel || 'Value'}: ${display}${suffix}`}
          className="w-28 text-center font-mono font-bold text-4xl text-neutral-100 hover:text-white focus:outline-none"
        >
          {display}
          {suffix ? <span className="ml-1 text-xl text-neutral-400">{suffix}</span> : null}
        </button>
      )}
      <button
        type="button"
        onClick={() => nudge(step)}
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase'}
        className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-200 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
