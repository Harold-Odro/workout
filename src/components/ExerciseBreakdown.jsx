import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SetRow from './SetRow.jsx';

function summariseSets(sets) {
  const completed = (sets || []).filter((s) => s.completed);
  const n = completed.length;
  if (n === 0) return '—';
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
    <div className="bg-surface-1 border border-hairline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-crimson"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="font-serif text-lg text-ink truncate leading-tight">{entry.name}</div>
          <div className="mt-1.5 font-mono text-[12px] tabular text-ink-faint">{summariseSets(entry.sets)}</div>
        </div>
        {open ? (
          <ChevronUp size={16} strokeWidth={1.4} className="text-ink-faint shrink-0 ml-3" />
        ) : (
          <ChevronDown size={16} strokeWidth={1.4} className="text-ink-faint shrink-0 ml-3" />
        )}
      </button>
      {open ? (
        <div className="px-5 pb-3 border-t border-hairline">
          {(entry.sets || []).map((s, i) =>
            editable ? (
              <button
                key={i}
                onClick={() => onEditSet?.(entry.exerciseId, i)}
                className="w-full text-left hover:bg-surface-high px-2 -mx-2 transition-colors"
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
    <div className="space-y-px bg-hairline">
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
