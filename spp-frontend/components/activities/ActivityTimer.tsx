'use client';

import { useEffect, useState } from 'react';
import { Flame, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ActivityRecord, TrackedActivityType } from '@/types/activity';

const LABELS: Record<TrackedActivityType, string> = {
  study_session: 'Session d’étude',
  tutoring_session: 'Séance de tutorat',
};

function formatElapsed(startedAt: string): string {
  const elapsedMs = Date.now() - new Date(startedAt).getTime();
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

type Props = {
  activityType: TrackedActivityType;
  active: ActivityRecord | null;
  busy: boolean;
  streakDays?: number;
  onStart: (type: TrackedActivityType) => void;
  onStop: (id: number) => void;
};

export function ActivityTimer({ activityType, active, busy, streakDays = 0, onStart, onStop }: Props) {
  // Re-render every second so the elapsed time ticks live while a session runs.
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => forceTick((n) => n + 1), 1_000);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="card flex flex-col gap-3">
      <div className="eyebrow flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          {active && <span className="pulse-dot" aria-hidden="true" />}
          {LABELS[activityType]}
        </span>
        {streakDays > 0 && (
          <span className="flex items-center gap-1 normal-case text-ink/45">
            <Flame size={12} strokeWidth={2.5} aria-hidden="true" />
            {streakDays}
          </span>
        )}
      </div>
      {active ? (
        <>
          <p className="font-display text-3xl tabular-nums text-navy">
            {formatElapsed(active.started_at)}
          </p>
          <p className="text-xs text-ink/55">
            Démarré à{' '}
            {new Date(active.started_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <Button onClick={() => onStop(active.id)} disabled={busy} fullWidth>
            <Square size={14} strokeWidth={2.5} className="mr-2" aria-hidden="true" />
            Arrêter
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink/60">Aucune session en cours.</p>
          <Button onClick={() => onStart(activityType)} disabled={busy} secondary fullWidth>
            <Play size={14} strokeWidth={2.5} className="mr-2" aria-hidden="true" />
            Démarrer
          </Button>
        </>
      )}
    </div>
  );
}
