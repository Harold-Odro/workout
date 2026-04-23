import { useEffect, useRef, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import Button from './Button.jsx';
import { formatMMSS } from '../lib/time.js';
import { tones } from '../lib/audio.js';

function summariseJust(set) {
  if (!set) return null;
  if (set.left || set.right) {
    const l = set.left ? `${set.left.reps}×${set.left.weightKg}kg` : '—';
    const r = set.right ? `${set.right.reps}×${set.right.weightKg}kg` : '—';
    return `L ${l} · R ${r}`;
  }
  return `${set.reps} × ${set.weightKg}kg`;
}

export default function RestTimer({
  durationSeconds,
  endsAt,
  onDone,
  onSkip,
  onAdd,            // optional: add 30s
  nextSetPreview,   // { reps, weightKg }
  justCompletedSet, // the set that was just logged
  exerciseName,
  setIndex,         // index of the set we're resting AFTER (0-based)
  totalSets,
  audioEnabled = true,
  hapticsEnabled = true,
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, (endsAt - Date.now()) / 1000)
  );
  const beepFlags = useRef({ 10: false, 5: false });
  const doneFiredRef = useRef(false);

  useEffect(() => {
    beepFlags.current = { 10: false, 5: false };
    doneFiredRef.current = false;
  }, [endsAt]);

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, (endsAt - Date.now()) / 1000);
      setRemaining(r);

      const whole = Math.ceil(r);
      if (whole === 10 && !beepFlags.current[10]) {
        beepFlags.current[10] = true;
        if (audioEnabled) tones.restCountdown();
      }
      if (whole === 5 && !beepFlags.current[5]) {
        beepFlags.current[5] = true;
        if (audioEnabled) tones.restCountdown();
      }

      if (r <= 0 && !doneFiredRef.current) {
        doneFiredRef.current = true;
        if (audioEnabled) tones.restEnd();
        if (hapticsEnabled) { try { navigator.vibrate?.(200); } catch {} }
        onDone?.();
      }
    }, 100);
    return () => clearInterval(id);
  }, [endsAt, audioEnabled, hapticsEnabled, onDone]);

  const progressPct = durationSeconds > 0
    ? Math.max(0, Math.min(100, (1 - remaining / durationSeconds) * 100))
    : 100;

  const nextSetNumber = typeof setIndex === 'number' ? setIndex + 2 : null;
  const hasNext = !!nextSetPreview && typeof nextSetNumber === 'number' && totalSets && nextSetNumber <= totalSets;

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Top ambient progress bar */}
      <div className="h-1 bg-neutral-900 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-green-500 transition-[width]"
          style={{ width: `${progressPct}%`, transitionDuration: '120ms' }}
        />
      </div>

      <div className="flex-1 flex flex-col px-5 pt-5 pb-6">
        {/* Just-completed badge */}
        {justCompletedSet ? (
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
              <Check size={14} className="text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">
                Logged · {exerciseName}
              </div>
              <div className="font-mono text-sm text-neutral-200 truncate">
                Set {setIndex + 1} · {summariseJust(justCompletedSet)}
              </div>
            </div>
          </div>
        ) : null}

        {/* Big centered "next up" block */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {hasNext ? (
            <>
              <div className="text-[11px] uppercase tracking-[0.3em] text-green-500">
                Next up
              </div>
              <div className="mt-3 text-sm text-neutral-400 uppercase tracking-wider">
                Set {nextSetNumber} of {totalSets}
              </div>
              <div className="mt-4 font-mono font-bold text-neutral-100 leading-none flex items-baseline">
                <span className="text-[5.5rem]">{nextSetPreview.reps}</span>
                <span className="text-2xl text-neutral-500 mx-2">×</span>
                <span className="text-[5.5rem]">{nextSetPreview.weightKg}</span>
                <span className="text-xl text-neutral-500 ml-1">kg</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-[11px] uppercase tracking-[0.3em] text-green-500">Next</div>
              <div className="mt-3 font-semibold text-neutral-100 text-2xl">
                Last set done
              </div>
            </>
          )}

          <div className="mt-8 flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500">
              Rest
            </span>
            <span className="font-mono font-bold text-neutral-400 text-4xl leading-none">
              {formatMMSS(remaining)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-2 min-h-11 text-sm text-neutral-400 hover:text-neutral-200 border border-neutral-800 rounded-xl hover:bg-neutral-900"
            >
              <Plus size={14} /> Add 30s
            </button>
          ) : null}
          <Button variant="primary" size="lg" className="w-full" onClick={onSkip}>
            {hasNext ? "I'm ready" : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
