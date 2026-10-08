'use client';

import { useEffect, useState } from 'react';

// A ticking timestamp, for clocks that must keep moving (running timers).
// Starts at 0 so server and first client render agree, then ticks.
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const first = requestAnimationFrame(tick);
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(id);
    };
  }, [intervalMs, enabled]);

  return now;
}
