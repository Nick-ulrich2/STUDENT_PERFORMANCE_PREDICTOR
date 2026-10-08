'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Bar } from '@/components/ui/Bar';
import { formatNumber } from '@/lib/format';
import type { ActivityRecord, AttendanceStatus } from '@/types/activity';

type AttendanceCardProps = {
  today: ActivityRecord | null;
  attendanceRate: number | null;
  busy: boolean;
  onMark: (status: AttendanceStatus) => Promise<boolean>;
};

export function AttendanceCard({ today, attendanceRate, busy, onMark }: AttendanceCardProps) {
  const [justMarked, setJustMarked] = useState(false);
  const marked = today ? (today.status as AttendanceStatus) : null;
  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const mark = async (status: AttendanceStatus) => {
    const ok = await onMark(status);
    if (ok) setJustMarked(true);
  };

  return (
    <article className="card c5">
      <div className="card-h">
        <div>
          <h3 className="display">Présence du jour</h3>
          <p>{dateLabel}</p>
        </div>
      </div>
      <div className="stamp-box">
        {marked && (
          <span
            className={`stamp${marked === 'absent' ? ' absent' : ''}${justMarked ? ' drop' : ''}`}
            style={{ opacity: 0.9 }}
          >
            {marked === 'present' ? 'Présent' : 'Absent'}
          </span>
        )}
        <div className="seg" role="group" aria-label="Statut de présence">
          <button type="button" aria-pressed={marked === 'present'} disabled={busy || marked !== null} onClick={() => mark('present')}>
            <Check size={18} style={{ verticalAlign: -3 }} aria-hidden="true" /> Présent·e
          </button>
          <button type="button" aria-pressed={marked === 'absent'} disabled={busy || marked !== null} onClick={() => mark('absent')}>
            <X size={18} style={{ verticalAlign: -3 }} aria-hidden="true" /> Absent·e
          </button>
        </div>
        <p className="tiny muted">
          Assiduité = jours présents ÷ jours marqués sur 7 jours.{' '}
          {marked ? 'Déjà marquée aujourd’hui : utilisez « Corriger » dans le journal.' : ''}
        </p>
      </div>
      <div style={{ marginTop: '1.4rem' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="lbl">Assiduité (7 j)</span>
          <b className="display" style={{ fontSize: '1.6rem' }}>
            {attendanceRate === null ? '—' : `${formatNumber(attendanceRate)} %`}
          </b>
        </div>
        <div style={{ padding: '.6rem 0' }}>
          <Bar pct={attendanceRate ?? 0} threshold={70} label={`Assiduité sur 7 jours : ${attendanceRate ?? 'inconnue'}`} />
        </div>
      </div>
    </article>
  );
}
