'use client';

import { useInView } from '@/hooks/useInView';

export type WeekDay = { label: string; hours: number; today: boolean };

export function WeekBars({ days }: { days: WeekDay[] }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const max = Math.max(...days.map((d) => d.hours), 1);
  return (
    <div ref={ref} className="week" role="img" aria-label={`Heures d’étude des 7 derniers jours : ${days.map((d) => d.hours.toFixed(1)).join(', ')}`}>
      {days.map((d, i) => (
        <div key={i} className={d.today ? 'today' : ''}>
          <i style={{ height: inView ? Math.max(4, (d.hours / max) * 60) : 0 }} />
          {d.label}
        </div>
      ))}
    </div>
  );
}
