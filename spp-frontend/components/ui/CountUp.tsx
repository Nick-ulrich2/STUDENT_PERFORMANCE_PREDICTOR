'use client';

import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';
import { formatNumber } from '@/lib/format';
import { useI18n } from '@/lib/i18n';

type CountUpProps = { value: number; decimals?: number; duration?: number; delay?: number };

export function CountUp({ value, decimals = 0, duration = 1200, delay = 0 }: CountUpProps) {
  const { locale } = useI18n();
  const [ref, inView] = useInView<HTMLSpanElement>(0.25);
  const current = useCountUp(value, inView, { dur: duration, delay });
  return <span ref={ref}>{formatNumber(current, decimals, locale)}</span>;
}
