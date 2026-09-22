'use client';

import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ActivityRecord } from '@/types/activity';

const TYPE_LABELS: Record<string, string> = {
  study_session: 'Session d’étude',
  tutoring_session: 'Séance de tutorat',
  attendance: 'Assiduité',
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  present: 'Présent',
  absent: 'Absent',
  corrected: 'Corrigée (remplacée)',
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
    return <div className="card text-sm text-ink/60">Aucune activité enregistrée pour le moment.</div>;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-ink/60">
            <th className="py-2 pr-4 font-semibold">Type</th>
            <th className="py-2 pr-4 font-semibold">Début</th>
            <th className="py-2 pr-4 font-semibold">Fin</th>
            <th className="py-2 pr-4 font-semibold">Statut</th>
            <th className="py-2 pr-4 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {visible.map((a) => (
            <Fragment key={a.id}>
              <tr className="border-b border-line/60 last:border-0">
                <td className="py-3 pr-4">{TYPE_LABELS[a.activity_type] ?? a.activity_type}</td>
                <td className="py-3 pr-4">{formatDateTime(a.started_at)}</td>
                <td className="py-3 pr-4">{a.ended_at ? formatDateTime(a.ended_at) : '—'}</td>
                <td className="py-3 pr-4">{STATUS_LABELS[a.status] ?? a.status}</td>
                <td className="py-3 pr-4 text-right">
                  {a.activity_type !== 'attendance' && a.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(editingId === a.id ? null : a.id);
                        setNote('');
                      }}
                      className="rounded-full border border-line px-3 py-1 text-xs font-bold text-navy hover:border-navy"
                    >
                      Corriger
                    </button>
                  )}
                </td>
              </tr>
              {editingId === a.id && (
                <tr className="border-b border-line/60 bg-sky/30">
                  <td colSpan={5} className="py-3 pr-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
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
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
