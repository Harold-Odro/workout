import { TrendingUp } from 'lucide-react';
import { WORKOUT_META, describeLevel } from '../lib/workouts.js';
import Button from './Button.jsx';

export default function ProgressionBanner({ suggestion, onAccept, onDismiss }) {
  if (!suggestion) return null;
  const meta = WORKOUT_META[suggestion.type];
  const nextDesc = describeLevel(suggestion.type, suggestion.toLevel);

  return (
    <div className="mx-5 mb-4 rounded-2xl bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/40 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <TrendingUp size={18} className="text-green-400" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-neutral-100">Ready to level up?</h3>
          <p className="mt-1 text-sm text-neutral-300">
            You've crushed {meta?.name} Level {suggestion.fromLevel} {suggestion.successfulCount ?? 4} times.
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Level {suggestion.toLevel}: {nextDesc}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="sm" onClick={() => onAccept(suggestion)}>
              Level up
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDismiss(suggestion)}>
              Not yet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
