'use client';

import { useInView } from '@/hooks/useInView';
import { formatNumber } from '@/lib/format';
import { useI18n } from '@/lib/i18n';

export type WeekDay = { label: string; hours: number; today: boolean };

export function WeekBars({ days }: { days: WeekDay[] }) {
  const { t, locale } = useI18n();
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const max = Math.max(...days.map((d) => d.hours), 1);
  return (
    <div ref={ref} className="week" role="img" aria-label={`${t('Heures d’étude des 7 derniers jours')} : ${days.map((d) => formatNumber(d.hours, 1, locale)).join(', ')}`}>
      {days.map((d, i) => (
        <div key={i} className={d.today ? 'today' : ''}>
          <i style={{ height: inView ? Math.max(4, (d.hours / max) * 60) : 0 }} />
          {d.label}
        </div>
      ))}
    </div>
  );
}
