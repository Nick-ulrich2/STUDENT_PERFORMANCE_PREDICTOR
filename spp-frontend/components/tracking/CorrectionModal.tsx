'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Seg } from '@/components/ui/Seg';
import { durationMs } from '@/lib/streak';
import type { ActivityCorrectionPayload, ActivityRecord, AttendanceStatus } from '@/types/activity';

const NOTE_MAX = 280;

type CorrectionModalProps = {
  activity: ActivityRecord;
  onClose: () => void;
  onSubmit: (payload: ActivityCorrectionPayload) => Promise<boolean>;
};

export function CorrectionModal({ activity, onClose, onSubmit }: CorrectionModalProps) {
  const isAttendance = activity.activity_type === 'attendance';
  const [status, setStatus] = useState<AttendanceStatus>(activity.status === 'absent' ? 'absent' : 'present');
  const [minutes, setMinutes] = useState(String(Math.max(1, Math.round(durationMs(activity) / 60_000))));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (trimmed.length < 1 || trimmed.length > NOTE_MAX) {
      return setError(trimmed.length ? `Le motif ne doit pas dépasser ${NOTE_MAX} caractères.` : `Le motif est obligatoire (1 à ${NOTE_MAX} caractères).`);
    }
    const payload: ActivityCorrectionPayload = { note: trimmed };
    if (isAttendance) {
      payload.status = status;
    } else {
      const mins = Number(minutes);
      if (!Number.isFinite(mins) || mins < 1 || mins > 600) return setError('La durée doit être comprise entre 1 et 600 minutes.');
      payload.ended_at = new Date(new Date(activity.started_at).getTime() + mins * 60_000).toISOString();
    }
    setError('');
    setPending(true);
    const ok = await onSubmit(payload);
    setPending(false);
    if (ok) onClose();
  };

  return (
    <Modal title="Corriger cette entrée" description="L’entrée d’origine est conservée, avec votre motif." onClose={onClose}>
      <form className="stack" style={{ ['--s' as string]: '1rem' }} noValidate onSubmit={submit}>
        {isAttendance ? (
          <div className="field">
            <span className="lbl">Statut correct</span>
            <Seg
              value={status}
              onChange={setStatus}
              label="Statut correct"
              options={[
                { value: 'present', label: 'Présent·e' },
                { value: 'absent', label: 'Absent·e' },
              ]}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="correction-minutes">Durée correcte (minutes)</label>
            <input id="correction-minutes" className="inp" type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="correction-note">
            Motif{' '}
            <span className="hint" style={{ color: note.length > NOTE_MAX ? 'var(--risk)' : undefined }}>
              {note.length} / {NOTE_MAX}
            </span>
          </label>
          <textarea
            id="correction-note"
            className={`inp${error ? ' err' : ''}`}
            rows={3}
            value={note}
            placeholder="Pourquoi cette entrée était-elle erronée ?"
            aria-invalid={Boolean(error)}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="err-msg" aria-live="polite">
            {error && (
              <>
                <AlertTriangle size={14} aria-hidden="true" /> {error}
              </>
            )}
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn" type="submit" disabled={pending}>
            Enregistrer la correction
          </button>
        </div>
      </form>
    </Modal>
  );
}
