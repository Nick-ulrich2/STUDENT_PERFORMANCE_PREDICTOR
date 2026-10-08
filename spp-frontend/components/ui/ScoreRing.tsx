'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useInView } from '@/hooks/useInView';
import { EASE, tween } from '@/lib/motion';
import { formatNumber } from '@/lib/format';
import { scoreTone } from '@/lib/scoreTone';

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ScoreRingProps = { score: number; size?: number; decimals?: number; label?: string };

export function ScoreRing({ score, size = 180, decimals = 0, label = '/ 100' }: ScoreRingProps) {
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  const [progress, setProgress] = useState(0);
  const tone = scoreTone(score);

  useEffect(() => {
    if (!inView) return;
    const t = tween(1400, setProgress, { ease: EASE.inOut });
    return () => t.cancel();
  }, [inView, score]);

  return (
    <div
      ref={ref}
      className={`ring ${tone.className}`}
      style={{ '--sz': `${size}px` } as CSSProperties}
      role="img"
      aria-label={`Score ${formatNumber(score, decimals)} sur 100, niveau ${tone.label}`}
    >
      <svg viewBox="0 0 180 180">
        <circle className="tr" cx="90" cy="90" r={RADIUS} strokeWidth="14" />
        <circle
          className="pg"
          cx="90"
          cy="90"
          r={RADIUS}
          strokeWidth="14"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - (score / 100) * progress)}
        />
      </svg>
      <div className="c">
        <b className="n">{formatNumber(score * progress, decimals)}</b>
        <small>{label}</small>
      </div>
    </div>
  );
}
