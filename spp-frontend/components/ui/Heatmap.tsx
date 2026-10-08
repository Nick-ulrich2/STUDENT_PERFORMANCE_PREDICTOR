'use client';

import type { CSSProperties } from 'react';
import { useInView } from '@/hooks/useInView';

export type HeatCell = { key: string; level: number; date?: Date };

export function Heatmap({ days, weeks, label }: { days: HeatCell[]; weeks: number; label: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  return (
    <>
      <div
        ref={ref}
        className={`heat${inView ? ' in' : ''}`}
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
        role="img"
        aria-label={label}
      >
        {days.map((d, i) => (
          <i
            key={d.key}
            data-l={d.level}
            style={{ '--i': i } as CSSProperties}
            title={d.date?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          />
        ))}
      </div>
      <div className="heat-legend" aria-hidden="true">
        Moins
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} style={{ background: `var(--h${l})` }} />
        ))}
        Plus
      </div>
    </>
  );
}
