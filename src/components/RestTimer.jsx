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
  onAdd,
  nextSetPreview,
  justCompletedSet,
  exerciseName,
  setIndex,
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
      {/* Top progress bar — thin, fast, crimson */}
      <div className="h-0.5 bg-surface-high relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-crimson-bright transition-[width]"
          style={{ width: `${progressPct}%`, transitionDuration: '120ms' }}
        />
      </div>

      <div className="flex-1 flex flex-col px-6 pt-6 pb-7">
        {/* Just-logged confirmation */}
        {justCompletedSet ? (
          <div className="border border-hairline px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-crimson-blood/40 flex items-center justify-center shrink-0">
              <Check size={14} className="text-crimson" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="label-md text-ink-faint">
                Logged · {exerciseName}
              </div>
              <div className="font-mono tabular text-sm text-ink-dim truncate mt-0.5">
                Set&nbsp;{String(setIndex + 1).padStart(2, '0')} · {summariseJust(justCompletedSet)}
              </div>
            </div>
          </div>
        ) : null}

        {/* Next-up showpiece */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {hasNext ? (
            <>
              <div className="label-md text-crimson tracking-[0.32em]">
                ◆&nbsp;&nbsp;Next up
              </div>
              <div className="mt-3 font-serif italic text-ink-dim text-base tabular">
                Set {nextSetNumber} of {totalSets}
              </div>
              <div className="mt-8 font-serif font-light text-ink leading-none flex items-baseline tabular">
                <span className="text-[6rem]">{nextSetPreview.reps}</span>
                <span className="text-3xl text-ink-faint mx-3 font-light">×</span>
                <span className="text-[6rem]">{nextSetPreview.weightKg}</span>
                <span className="font-mono uppercase tracking-widest text-sm text-ink-faint ml-2 self-end pb-3">kg</span>
              </div>
            </>
          ) : (
            <>
              <div className="label-md text-crimson tracking-[0.32em]">
                ◆&nbsp;&nbsp;Closing
              </div>
              <div className="mt-6 font-serif text-3xl text-ink italic">
                Last set complete.
              </div>
            </>
          )}

          <div className="mt-12 flex flex-col items-center">
            <span className="label-md text-ink-faint">Rest</span>
            <span className="mt-2 font-mono tabular font-light text-5xl leading-none text-ink-dim">
              {formatMMSS(remaining)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-2 min-h-12 label-md text-ink-faint hover:text-crimson border border-hairline-strong rounded transition-colors"
            >
              <Plus size={14} strokeWidth={1.6} /> Add 30s
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
