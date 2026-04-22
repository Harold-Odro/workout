import { ChevronRight } from 'lucide-react';

export default function WorkoutCard({ workout, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left rounded-2xl bg-neutral-900 border border-neutral-800',
        'px-5 py-5 min-h-[112px] flex items-center gap-4',
        'transition-colors hover:border-green-500/50 active:bg-neutral-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
      ].join(' ')}
    >
      <div className="flex-1">
        <div className="text-xl font-semibold text-neutral-100">{workout.name}</div>
        <div className="mt-1 text-sm text-neutral-400">{workout.short}</div>
        <div className="mt-2 text-xs text-green-500 font-medium uppercase tracking-wide">
          ~{workout.estMinutes} min
        </div>
      </div>
      <ChevronRight className="text-neutral-500" size={24} aria-hidden />
    </button>
  );
}
