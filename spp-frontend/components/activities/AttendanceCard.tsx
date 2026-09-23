'use client';

import { CheckCircle2, Flame, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ActivityRecord, AttendanceStatus } from '@/types/activity';
import { computeStreakForType } from '@/lib/streak';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isToday(startedAt: string): boolean {
  return startedAt.slice(0, 10) === todayIsoDate();
}

type Props = {
  activities: ActivityRecord[];
  busy: boolean;
  onMark: (status: AttendanceStatus) => void;
};

export function AttendanceCard({ activities, busy, onMark }: Props) {
  // The most recent, still-active (non-corrected) attendance mark for today.
  const todayMark = activities.find(
    (a): a is ActivityRecord & { status: AttendanceStatus } =>
      a.activity_type === 'attendance' &&
      (a.status === 'present' || a.status === 'absent') &&
      isToday(a.started_at),
  );

  const streakDays = computeStreakForType(activities, 'attendance');

  return (
    <div className="card flex flex-col gap-3">
      <div className="eyebrow flex items-center justify-between gap-2">
        Assiduité du jour
        {streakDays > 0 && (
          <span className="flex items-center gap-1 normal-case text-ink/45">
            <Flame size={12} strokeWidth={2.5} aria-hidden="true" />
            {streakDays}
          </span>
        )}
      </div>
      {todayMark ? (
        <>
          <p
            className={`flex items-center gap-2 font-display text-2xl ${
              todayMark.status === 'present' ? 'text-navy' : 'text-red-600'
            }`}
          >
            {todayMark.status === 'present' ? (
              <CheckCircle2 size={22} strokeWidth={2} aria-hidden="true" />
            ) : (
              <XCircle size={22} strokeWidth={2} aria-hidden="true" />
            )}
            {todayMark.status === 'present' ? 'Présent' : 'Absent'}
          </p>
          <p className="text-xs text-ink/55">
            Une erreur ? Pointez à nouveau : le pointage précédent sera automatiquement remplacé.
          </p>
          <Button
            onClick={() => onMark(todayMark.status === 'present' ? 'absent' : 'present')}
            disabled={busy}
            secondary
            fullWidth
          >
            Marquer {todayMark.status === 'present' ? 'absent' : 'présent'} à la place
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink/60">Pas encore pointé aujourd’hui.</p>
          <div className="flex gap-2">
            <Button onClick={() => onMark('present')} disabled={busy} fullWidth>
              <CheckCircle2 size={14} strokeWidth={2.5} className="mr-2" aria-hidden="true" />
              Présent
            </Button>
            <Button onClick={() => onMark('absent')} disabled={busy} secondary fullWidth>
              <XCircle size={14} strokeWidth={2.5} className="mr-2" aria-hidden="true" />
              Absent
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
