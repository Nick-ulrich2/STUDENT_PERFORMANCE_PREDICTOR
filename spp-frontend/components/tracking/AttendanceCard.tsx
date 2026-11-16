'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Bar } from '@/components/ui/Bar';
import { formatNumber } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { intlLocale } from '@/lib/i18n/core';
import type { ActivityRecord, AttendanceStatus } from '@/types/activity';

type AttendanceCardProps = {
  today: ActivityRecord | null;
  attendanceRate: number | null;
  busy: boolean;
  onMark: (status: AttendanceStatus) => Promise<boolean>;
};

export function AttendanceCard({ today, attendanceRate, busy, onMark }: AttendanceCardProps) {
  const [justMarked, setJustMarked] = useState(false);
  const { t, locale } = useI18n();
  const marked = today ? (today.status as AttendanceStatus) : null;
  const dateLabel = new Date().toLocaleDateString(intlLocale(locale), { weekday: 'long', day: 'numeric', month: 'long' });

  const mark = async (status: AttendanceStatus) => {
    const ok = await onMark(status);
    if (ok) setJustMarked(true);
  };

  return (
    <article className="card c5">
      <div className="card-h">
        <div>
          <h3 className="display">{t('Présence du jour')}</h3>
          <p>{dateLabel}</p>
        </div>
      </div>
      <div className="stamp-box">
        {marked && (
          <span
            className={`stamp${marked === 'absent' ? ' absent' : ''}${justMarked ? ' drop' : ''}`}
            style={{ opacity: 0.9 }}
          >
            {marked === 'present' ? t('Présent') : t('Absent')}
          </span>
        )}
        <div className="seg" role="group" aria-label={t('Statut de présence')}>
          <button type="button" aria-pressed={marked === 'present'} disabled={busy || marked !== null} onClick={() => mark('present')}>
            <Check size={18} style={{ verticalAlign: -3 }} aria-hidden="true" /> {t('Présent·e')}
          </button>
          <button type="button" aria-pressed={marked === 'absent'} disabled={busy || marked !== null} onClick={() => mark('absent')}>
            <X size={18} style={{ verticalAlign: -3 }} aria-hidden="true" /> {t('Absent·e')}
          </button>
        </div>
        <p className="tiny muted">
          {t('Assiduité = jours présents ÷ jours marqués sur 7 jours.')}{' '}
          {marked ? t('Déjà marquée aujourd’hui : utilisez « Corriger » dans le journal.') : ''}
        </p>
      </div>
      <div style={{ marginTop: '1.4rem' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="lbl">{t('Assiduité (7 j)')}</span>
          <b className="display" style={{ fontSize: '1.6rem' }}>
            {attendanceRate === null ? '—' : `${formatNumber(attendanceRate, 0, locale)} %`}
          </b>
        </div>
        <div style={{ padding: '.6rem 0' }}>
          <Bar pct={attendanceRate ?? 0} threshold={70} label={`${t('Assiduité sur 7 jours')} : ${attendanceRate ?? t('inconnue')}`} />
        </div>
      </div>
    </article>
  );
}
