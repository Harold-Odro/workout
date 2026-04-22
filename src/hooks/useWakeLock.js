import { useEffect, useRef } from 'react';

export function useWakeLock(active) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function acquire() {
      if (!active) return;
      if (!('wakeLock' in navigator)) return;
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) {
          s.release?.();
          return;
        }
        sentinelRef.current = s;
        s.addEventListener?.('release', () => {
          sentinelRef.current = null;
        });
      } catch {
        // Silently ignore — wake lock is a nice-to-have.
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible' && active && !sentinelRef.current) {
        acquire();
      }
    }

    acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (sentinelRef.current) {
        sentinelRef.current.release?.();
        sentinelRef.current = null;
      }
    };
  }, [active]);
}
