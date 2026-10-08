'use client';

import { useEffect, useState } from 'react';
import { useInView } from '@/hooks/useInView';
import { tween } from '@/lib/motion';

const PEN_PATH = 'M14 86C4 44 58 8 128 10c72 2 122 32 118 74-4 46-66 76-146 72C34 152-4 118 22 70 40 36 96 20 150 20';

// The hand-drawn circle that "marks" a score. Colour comes from the --tone
// custom property of the surrounding .score-spot.
export function PenCircle({ delay = 500 }: { delay?: number }) {
  const [ref, inView] = useInView<SVGSVGElement>(0.25);
  const [offset, setOffset] = useState(1);

  useEffect(() => {
    if (!inView) return;
    const t = tween(900, (p) => setOffset(1 - p), { delay });
    return () => t.cancel();
  }, [inView, delay]);

  return (
    <svg ref={ref} className="pen" viewBox="0 0 260 170" preserveAspectRatio="none" aria-hidden="true">
      <path d={PEN_PATH} pathLength={1} strokeDasharray={1} strokeDashoffset={offset} />
    </svg>
  );
}

export { PEN_PATH };
