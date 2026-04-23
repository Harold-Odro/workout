import { ArrowUpRight } from 'lucide-react';
import { WORKOUT_META, describeLevel, estimatedMinutes } from '../lib/workouts.js';

export default function WorkoutCard({ type, level, onClick, index = 1 }) {
  const meta = WORKOUT_META[type];
  const desc = describeLevel(type, level);
  const mins = estimatedMinutes(type, level);
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
          <div className="flex items-baseline gap-3">
            <h3 className="font-serif text-2xl font-normal tracking-tight text-ink leading-none">
              {meta.name}
            </h3>
            <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint">
              LVL&nbsp;{String(level).padStart(2, '0')}
            </span>
          </div>

          <p className="mt-3 body-md text-ink-dim leading-snug">{desc}</p>

          <div className="mt-5 flex items-center gap-5 label-md text-ink-faint">
            <span className="text-crimson tabular">~{mins}&nbsp;MIN</span>
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

      {/* hover progress wipe */}
      <span
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-px bg-crimson-bright origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
      />
    </button>
  );
}
