'use client';

import { useInView } from '@/hooks/useInView';
import { useT } from '@/lib/i18n';

type BarProps = { pct: number; threshold?: number; warn?: boolean; label: string };

// Progress bar filling once it scrolls into view; the red tick marks the
// recommended threshold.
export function Bar({ pct, threshold, warn, label }: BarProps) {
  const t = useT();
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  const width = inView ? Math.max(0, Math.min(100, pct)) : 0;
  return (
    <div ref={ref} className="bar-static" role="img" aria-label={label}>
      <i style={{ width: `${width}%`, background: warn ? 'var(--warn)' : undefined }} />
      {threshold !== undefined && <u style={{ left: `${threshold}%` }} title={t('Seuil recommandé')} />}
    </div>
  );
}
