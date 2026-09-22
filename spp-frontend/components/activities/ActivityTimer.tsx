'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ActivityRecord, TrackedActivityType } from '@/types/activity';

const LABELS: Record<TrackedActivityType, string> = {
  study_session: 'Session d’étude',
  tutoring_session: 'Séance de tutorat',
};

function formatElapsed(startedAt: string): string {
  const elapsedMs = Date.now() - new Date(startedAt).getTime();
  const totalMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h${String(minutes).padStart(2, '0')}` : `${minutes} min`;
}

type Props = {
  activityType: TrackedActivityType;
  active: ActivityRecord | null;
  busy: boolean;
  onStart: (type: TrackedActivityType) => void;
  onStop: (id: number) => void;
};

export function ActivityTimer({ activityType, active, busy, onStart, onStop }: Props) {
  // Re-render every 30s so the elapsed time keeps advancing while an activity is running.
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="card flex flex-col gap-3">
      <div className="eyebrow">{LABELS[activityType]}</div>
      {active ? (
        <>
          <p className="font-display text-3xl text-navy">{formatElapsed(active.started_at)}</p>
          <p className="text-xs text-ink/55">
            Démarré à{' '}
            {new Date(active.started_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <Button onClick={() => onStop(active.id)} disabled={busy} fullWidth>
            Arrêter
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink/60">Aucune session en cours.</p>
          <Button onClick={() => onStart(activityType)} disabled={busy} secondary fullWidth>
            Démarrer
          </Button>
        </>
      )}
    </div>
  );
}
