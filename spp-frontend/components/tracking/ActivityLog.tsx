'use client';

import { BookOpen, Check, Pencil, Users } from 'lucide-react';
import { formatDuration, formatTime, relativeDay } from '@/lib/format';
import { durationMs } from '@/lib/streak';
import { useI18n, type TFunction } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/core';
import type { ActivityRecord } from '@/types/activity';

const TYPES = {
  study_session: { label: 'Étude', icon: BookOpen },
  tutoring_session: { label: 'Tutorat', icon: Users },
  attendance: { label: 'Présence', icon: Check },
} as const;

export function summary(a: ActivityRecord, t: TFunction, locale: Locale): string {
  if (a.activity_type === 'attendance') return a.status === 'present' ? t('Présent·e') : t('Absent·e');
  return a.ended_at ? formatDuration(durationMs(a), locale) : t('En cours');
}

type ActivityLogProps = {
  activities: ActivityRecord[];
  onCorrect: (activity: ActivityRecord) => void;
};

export function ActivityLog({ activities, onCorrect }: ActivityLogProps) {
  const { t, locale } = useI18n();
  const rows = activities.filter((a) => a.status !== 'corrected').slice(0, 8);
  if (rows.length === 0) {
    return <p className="muted">{t('Rien pour l’instant : démarrez une séance ou marquez votre présence.')}</p>;
  }
  return (
    <div className="log">
      {rows.map((a) => {
        const type = TYPES[a.activity_type];
        const Icon = type.icon;
        const original = a.corrected_from !== null ? activities.find((x) => x.id === a.corrected_from) : undefined;
        const inProgress = a.status === 'in_progress';
        return (
          <div key={a.id} className={`log-i${a.corrected_from !== null ? ' corr' : ''}`}>
            <div className="ic">
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div>
              <b>
                {t(type.label)} · {summary(a, t, locale)}
              </b>{' '}
              {a.corrected_from !== null && <span className="pill mark">{t('corrigée')}</span>}
              <div className="m">
                {relativeDay(a.started_at, locale)} · {formatTime(a.started_at, locale)}
              </div>
              {original && (
                <div className="m corr-note">
                  {t('Entrée d’origine conservée :')} <s>{summary(original, t, locale)}</s> · {t('Motif :')} « {a.note} »
                </div>
              )}
            </div>
            <button type="button" className="btn ghost sm" disabled={a.corrected_from !== null || inProgress} onClick={() => onCorrect(a)}>
              <Pencil size={16} aria-hidden="true" /> {t('Corriger')}
            </button>
          </div>
        );
      })}
    </div>
  );
}
