import { ArrowUpRight } from 'lucide-react';
import { PPL_META, describePPLWorkout, estimatedPPLMinutes } from '../lib/workoutsPPL.js';

export default function PPLWorkoutCard({ type, onClick, index = 1 }) {
  const meta = PPL_META[type];
  const num = String(index).padStart(2, '0');

  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left bg-surface-1 hover:bg-surface-high transition-colors duration-300 px-6 py-7 focus:outline-none focus-visible:ring-1 focus-visible:ring-crimson"
    >
      <div className="flex items-stretch gap-5">
        <div className="shrink-0 w-12 pt-1">
          <div className="font-mono text-xs tabular tracking-[0.2em] text-ink-faint group-hover:text-crimson transition-colors">
            {num}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-2xl font-normal tracking-tight text-ink leading-none">
            {meta.name}
          </h3>
          <p className="mt-3 body-md text-ink-dim leading-snug italic">
            {meta.tagline}
          </p>
          <div className="mt-5 flex items-center gap-5 label-md text-ink-faint">
            <span className="text-crimson tabular">~{estimatedPPLMinutes(type)}&nbsp;MIN</span>
            <span className="opacity-70">{describePPLWorkout(type)}</span>
            <span className="hairline flex-1" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-crimson">
              Begin
            </span>
          </div>
        </div>

        <div className="shrink-0 self-start text-ink-faint group-hover:text-crimson transition-colors">
          <ArrowUpRight size={22} strokeWidth={1.4} aria-hidden />
        </div>
      </div>

      <span
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-px bg-crimson-bright origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
      />
    </button>
  );
}
