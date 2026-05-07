import { ArrowUpRight } from 'lucide-react';
import { WORKOUT_META, describeLevel, estimatedMinutes } from '../lib/workouts.js';
import { PPL_META, describePPLWorkout, estimatedPPLMinutes } from '../lib/workoutsPPL.js';

// The hero card for Today's suggested workout. One big serif title, a brief
// "why" line from the suggestion engine, and the prescription underneath.
// Crimson edge on the left so it reads as the thing to do, not yet another
// tonal row.

export default function HeroWorkoutCard({ program, type, level, reason, onStart }) {
  const isPPL = program === 'ppl';
  const meta = isPPL ? PPL_META[type] : WORKOUT_META[type];
  if (!meta) return null;

  const minutes = isPPL ? estimatedPPLMinutes(type) : estimatedMinutes(type, level);
  const prescription = isPPL ? describePPLWorkout(type) : describeLevel(type, level);

  return (
    <button
      onClick={onStart}
      className="group relative w-full text-left overflow-hidden bg-surface-low hover:bg-surface-high transition-colors duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-crimson"
    >
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-0.75 bg-crimson-bright" />

      {/* faint radial behind the title */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(255,82,93,0.25), transparent 70%)' }}
      />

      <div className="relative px-7 py-8">
        <div className="flex items-center justify-between">
          <div className="label-md text-crimson tracking-[0.32em]">
            ◆&nbsp;&nbsp;Today's work
          </div>
          <div className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint">
            {isPPL ? 'PPL' : `SKIP · LVL ${String(level ?? 1).padStart(2, '0')}`}
          </div>
        </div>

        <h2 className="mt-5 font-serif text-4xl font-light leading-[1.05] tracking-tight text-ink">
          {meta.name}
        </h2>

        {reason ? (
          <p className="mt-3 font-serif italic text-base text-ink-dim leading-snug">
            {reason}.
          </p>
        ) : null}

        <div className="hairline mt-6" />

        <div className="mt-5 flex items-center gap-5">
          <div className="min-w-0">
            <div className="label-md text-ink-faint">Prescription</div>
            <div className="mt-1.5 font-mono text-[13px] tabular text-ink-dim truncate">
              {prescription}
            </div>
          </div>
          <div className="ml-auto text-right shrink-0">
            <div className="label-md text-ink-faint">Duration</div>
            <div className="mt-1.5 font-serif text-2xl tabular text-crimson leading-none">
              ~{minutes}
              <span className="ml-1 font-mono uppercase tracking-widest text-[11px] text-ink-faint">min</span>
            </div>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <span className="label-md text-crimson tracking-[0.22em] group-hover:tracking-[0.3em] transition-all">
            Begin now
          </span>
          <ArrowUpRight
            size={22}
            strokeWidth={1.4}
            className="text-crimson translate-x-0 group-hover:translate-x-1 transition-transform"
            aria-hidden
          />
        </div>
      </div>

      <span
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-px bg-crimson-bright origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
      />
    </button>
  );
}
