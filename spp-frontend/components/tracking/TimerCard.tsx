'use client';

import { BookOpen, Play, Square, Users } from 'lucide-react';
import { useNow } from '@/hooks/useNow';
import { formatClock } from '@/lib/format';
import { useT } from '@/lib/i18n';
import type { ActivityRecord, TrackedActivityType } from '@/types/activity';

const COPY = {
  study_session: { title: 'Séance d’étude', hint: 'Comptée dans « heures d’étude ».', icon: BookOpen },
  tutoring_session: { title: 'Séance de tutorat', hint: 'Comptée dans « séances de tutorat ».', icon: Users },
} as const;

type TimerCardProps = {
  type: TrackedActivityType;
  active: ActivityRecord | null;
  busy: boolean;
  onStart: (type: TrackedActivityType) => void;
  onStop: (activity: ActivityRecord) => void;
};

export function TimerCard({ type, active, busy, onStart, onStop }: TimerCardProps) {
  const t = useT();
  const copy = COPY[type];
  const running = active !== null;
  const now = useNow(1000, running);
  const elapsed = running && now ? now - new Date(active.started_at).getTime() : 0;

  return (
    <article className="card c6">
      <div className="card-h">
        <div>
          <h3 className="display">{t(copy.title)}</h3>
          <p>{t(copy.hint)} {t('Une seule session ouverte par type.')}</p>
        </div>
        {running ? (
          <span className="pill risk">
            <i className="dot-live" />
            {t('En cours')}
          </span>
        ) : (
          <span className="pill">{t('Prêt')}</span>
        )}
      </div>
      <div className="timer">
        <div className={`clock${running ? ' run' : ''}`} aria-live="off">
          {formatClock(elapsed)}
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          {running ? (
            <button type="button" className="btn" disabled={busy} onClick={() => onStop(active)}>
              <Square size={16} fill="currentColor" aria-hidden="true" /> {t('Arrêter')}
            </button>
          ) : (
            <button type="button" className="btn mark" disabled={busy} onClick={() => onStart(type)}>
              <Play size={16} fill="currentColor" aria-hidden="true" /> {t('Démarrer')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
