'use client';

import { useEffect, useState } from 'react';
import { tween } from '@/lib/motion';

export function useCountUp(target: number, run: boolean, { dur = 1200, delay = 0 } = {}): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    const t = tween(dur, (p) => setValue(target * p), { delay });
    return () => t.cancel();
  }, [run, target, dur, delay]);

  return value;
}
