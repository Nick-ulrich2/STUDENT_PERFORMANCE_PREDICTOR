'use client';

import { Flame } from 'lucide-react';

type Props = {
  days: number;
};

export function StreakBadge({ days }: Props) {
  if (days <= 0) return null;

  return (
    <span className="badge-pop inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-extrabold text-teal">
      <Flame size={14} strokeWidth={2.5} aria-hidden="true" />
      {days} {days > 1 ? 'jours de suite' : 'jour de suite'}
    </span>
  );
}
