import { useEffect, useRef, useState } from 'react';
import ProgressRing from './ProgressRing.jsx';
import Button from './Button.jsx';
import { formatMMSS } from '../lib/time.js';
import { tones } from '../lib/audio.js';

export default function RestTimer({
  durationSeconds,
  endsAt,
  onDone,
  onSkip,
  nextSetPreview, // { reps, weightKg } to show what's next
  audioEnabled = true,
  hapticsEnabled = true,
}) {
  const [remaining, setRemaining] = useState(
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
        if (hapticsEnabled) {
          try { navigator.vibrate?.(200); } catch {}
        }
        onDone?.();
      }
    }, 100);
    return () => clearInterval(id);
  }, [endsAt, audioEnabled, hapticsEnabled, onDone]);

  const progress = durationSeconds > 0 ? 1 - remaining / durationSeconds : 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
      <div className="text-sm uppercase tracking-widest text-neutral-500 mb-4">
        Rest
      </div>
      <ProgressRing progress={progress} size={280} color="#60a5fa">
        <div className="font-mono font-bold text-neutral-100 text-[5.5rem] leading-none">
          {formatMMSS(remaining)}
        </div>
      </ProgressRing>
      {nextSetPreview ? (
        <div className="mt-6 text-sm text-neutral-400">
          Next set:{' '}
          <span className="font-mono text-neutral-200">
            {nextSetPreview.reps} × {nextSetPreview.weightKg}kg
          </span>
        </div>
      ) : null}
      <div className="mt-8 w-full max-w-xs">
        <Button variant="secondary" size="md" className="w-full" onClick={onSkip}>
          Skip rest
        </Button>
      </div>
    </div>
  );
}
