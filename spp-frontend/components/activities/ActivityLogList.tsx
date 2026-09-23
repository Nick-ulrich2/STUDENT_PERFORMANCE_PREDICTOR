'use client';

import { useState } from 'react';
import { BookOpen, CalendarCheck, History, Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ActivityRecord } from '@/types/activity';

const TYPE_LABELS: Record<string, string> = {
  study_session: 'Session d’étude',
  tutoring_session: 'Séance de tutorat',
  attendance: 'Assiduité',
};

const TYPE_ICONS: Record<string, typeof BookOpen> = {
  study_session: BookOpen,
  tutoring_session: Users,
  attendance: CalendarCheck,
};

const STATUS_STYLES: Record<string, { label: string; text: string; bg: string }> = {
  in_progress: { label: 'En cours', text: '#2d7770', bg: '#d7eee4' },
  completed: { label: 'Terminée', text: '#123d59', bg: '#dff0f4' },
  cancelled: { label: 'Annulée', text: '#57534e', bg: '#e7e5e4' },
  present: { label: 'Présent', text: '#2d7770', bg: '#d7eee4' },
  absent: { label: 'Absent', text: '#b91c1c', bg: '#fee2e2' },
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

type Props = {
  activities: ActivityRecord[];
  busy: boolean;
  onCorrect: (id: number, note: string) => void;
};

export function ActivityLogList({ activities, busy, onCorrect }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [note, setNote] = useState('');

  // Superseded rows (status "corrected") are history for the raw log, not
  // something the student needs to see day-to-day.
  const visible = activities.filter((a) => a.status !== 'corrected').slice(0, 15);

  if (visible.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 py-10 text-center">
        <History size={28} strokeWidth={1.5} className="text-ink/30" aria-hidden="true" />
        <p className="text-sm text-ink/60">Aucune activité enregistrée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {visible.map((a) => {
        const Icon = TYPE_ICONS[a.activity_type] ?? BookOpen;
        const status = STATUS_STYLES[a.status] ?? { label: a.status, text: '#123d59', bg: '#dff0f4' };
        const canCorrect = a.activity_type !== 'attendance' && a.status === 'completed';

        return (
          <div key={a.id} className="card grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-sky text-navy">
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">
                    {TYPE_LABELS[a.activity_type] ?? a.activity_type}
                  </p>
                  <p className="text-xs text-ink/55">
                    {formatDateTime(a.started_at)}
                    {a.ended_at ? ` → ${formatDateTime(a.ended_at)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ color: status.text, backgroundColor: status.bg }}
                >
                  {status.label}
                </span>
                {canCorrect && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(editingId === a.id ? null : a.id);
                      setNote('');
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-bold text-navy hover:border-navy"
                  >
                    <Pencil size={12} strokeWidth={2.5} aria-hidden="true" />
                    Corriger
                  </button>
                )}
              </div>
            </div>

            {editingId === a.id && (
              <div className="flex flex-col gap-2 rounded-xl bg-sky/30 p-3 md:flex-row md:items-center">
                <input
                  className="form-input flex-1"
                  placeholder="Raison de la correction (ex : oublié d’arrêter le chrono)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button
                  disabled={busy || note.trim().length === 0}
                  onClick={() => {
                    onCorrect(a.id, note.trim());
                    setNote('');
                    setEditingId(null);
                  }}
                >
                  Valider
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
