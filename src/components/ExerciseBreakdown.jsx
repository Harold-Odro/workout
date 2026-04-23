import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SetRow from './SetRow.jsx';

function summariseSets(sets) {
  const completed = (sets || []).filter((s) => s.completed);
  const n = completed.length;
  if (n === 0) return '—';
  // For unilateral, summarise reps range across both sides
  const first = completed[0];
  if (first.left || first.right) {
    const reps = completed.flatMap((s) => [s.left?.reps, s.right?.reps]).filter(Number.isFinite);
    const weights = completed
      .flatMap((s) => [s.left?.weightKg, s.right?.weightKg])
      .filter((w) => Number.isFinite(w) && w > 0);
    const repsStr = reps.length ? `${Math.min(...reps)}–${Math.max(...reps)}` : '0';
    const wStr = weights.length ? ` @ ${Math.max(...weights)}kg` : '';
    return `${n} sets · ${repsStr}${wStr}`;
  }
  const reps = completed.map((s) => Number(s.reps) || 0);
  const weights = completed.map((s) => Number(s.weightKg) || 0);
  const repsStr = `${Math.min(...reps)}–${Math.max(...reps)}`;
  const topW = Math.max(...weights);
  return `${n} sets · ${repsStr}${topW > 0 ? ` @ ${topW}kg` : ''}`;
}

function ExerciseCard({ entry, defaultOpen = false, editable = false, onEditSet }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-xl"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-neutral-100 truncate">{entry.name}</div>
          <div className="mt-0.5 text-xs text-neutral-500">{summariseSets(entry.sets)}</div>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-neutral-500 shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-neutral-500 shrink-0" />
        )}
      </button>
      {open ? (
        <div className="px-4 pb-3 border-t border-neutral-800">
          {(entry.sets || []).map((s, i) =>
            editable ? (
              <button
                key={i}
                onClick={() => onEditSet?.(entry.exerciseId, i)}
                className="w-full text-left hover:bg-neutral-800/40 rounded-md px-2 -mx-2"
              >
                <SetRow index={i} set={s} />
              </button>
            ) : (
              <SetRow key={i} index={i} set={s} />
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ExerciseBreakdown({ exercises, editable = false, onEditSet, defaultOpen = false }) {
  if (!exercises || exercises.length === 0) return null;
  return (
    <div className="space-y-2">
      {exercises.map((e) => (
        <ExerciseCard
          key={e.exerciseId}
          entry={e}
          defaultOpen={defaultOpen}
          editable={editable}
          onEditSet={onEditSet}
        />
      ))}
    </div>
  );
}
