'use client';

import { useEffect, useState } from 'react';
import { useInView } from '@/hooks/useInView';
import { tween } from '@/lib/motion';
import { formatNumber } from '@/lib/format';

type SparkProps = { values: number[]; height?: number };

export function Spark({ values, height = 90 }: SparkProps) {
  const [ref, inView] = useInView<SVGSVGElement>(0.25);
  const [offset, setOffset] = useState(1);

  useEffect(() => {
    if (!inView) return;
    const t = tween(1100, (p) => setOffset(1 - p));
    return () => t.cancel();
  }, [inView]);

  const width = 600;
  const pad = 12;
  const max = Math.max(...values, 70);
  const min = Math.min(...values, 55);
  const points = values.map((v, i) => [
    pad + (i * (width - 2 * pad)) / Math.max(1, values.length - 1),
    height - pad - ((v - min) / (max - min || 1)) * (height - 2 * pad),
  ]);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg
      ref={ref}
      className="spark"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Évolution des scores : ${values.map((v) => formatNumber(v, 1)).join(', ')}`}
    >
      <path d={`${line} L${last[0]} ${height} L${points[0][0]} ${height}Z`} fill="var(--mark)" opacity=".35" />
      <path d={line} pathLength={1} strokeDasharray={1} strokeDashoffset={offset} fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === points.length - 1 ? 7 : 4}
          fill={i === points.length - 1 ? 'var(--mark)' : 'var(--ink)'}
          stroke="var(--ink)"
          strokeWidth="2.5"
        />
      ))}
    </svg>
  );
}
