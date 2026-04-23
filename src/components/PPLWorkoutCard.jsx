import { ChevronRight } from 'lucide-react';
import { PPL_META, describePPLWorkout, estimatedPPLMinutes } from '../lib/workoutsPPL.js';

export default function PPLWorkoutCard({ type, onClick }) {
  const meta = PPL_META[type];
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left rounded-2xl bg-neutral-900 border border-neutral-800',
        'px-5 py-5 min-h-28 flex items-center gap-4',
        'transition-colors hover:border-green-500/50 active:bg-neutral-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
      ].join(' ')}
    >
      <div className="flex-1">
        <div className="text-xl font-semibold text-neutral-100">{meta.name}</div>
        <div className="mt-1 text-sm text-neutral-400">{meta.tagline}</div>
        <div className="mt-2 text-xs text-green-500 font-medium uppercase tracking-wide">
          {describePPLWorkout(type)} · ~{estimatedPPLMinutes(type)} min
        </div>
      </div>
      <ChevronRight className="text-neutral-500" size={24} aria-hidden />
    </button>
  );
}
