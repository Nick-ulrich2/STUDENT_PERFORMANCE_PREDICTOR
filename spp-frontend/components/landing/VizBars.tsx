'use client';

import { useInView } from '@/hooks/useInView';

const WIDTHS = [88, 64, 48, 40, 34, 34];

export function VizBars() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  return (
    <div
      ref={ref}
      className="viz"
      style={{ padding: '1rem 1.4rem', display: 'grid', alignContent: 'center', justifyItems: 'stretch', gap: '.5rem' }}
      aria-hidden="true"
    >
      {WIDTHS.map((w, i) => (
        <div key={i} style={{ height: 7, background: '#e0d6bd', borderRadius: 9, overflow: 'hidden' }}>
          <i
            style={{
              display: 'block',
              height: '100%',
              background: 'var(--ink)',
              borderRadius: 9,
              width: inView ? `${w}%` : 0,
              transition: `width .9s var(--ease) ${i * 0.08}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
