import { AlertTriangle, Check } from 'lucide-react';
import { formatTime } from '@/lib/format';

export type SaveState = 'checking' | 'saved' | 'missing';

type SaveStatusProps = { state: SaveState; modelName: string; at: number };

export function SaveStatus({ state, modelName, at }: SaveStatusProps) {
  return (
    <article className="card flat">
      <div className="stack" style={{ ['--s' as string]: '.7rem' }}>
        {state === 'saved' && (
          <div className="save">
            <Check size={18} aria-hidden="true" /> Enregistrée dans votre historique
          </div>
        )}
        {state === 'missing' && (
          <>
            <div className="save fail">
              <AlertTriangle size={18} aria-hidden="true" /> Non enregistrée : la base n’a pas confirmé l’écriture
            </div>
            <p className="tiny muted">Votre estimation est tout de même affichée. Elle n’apparaîtra pas dans l’historique.</p>
          </>
        )}
        {state === 'checking' && <p className="tiny muted">Vérification de l’enregistrement…</p>}
        <div className="meta-line">
          <span>modèle {modelName}</span>
          <span>{formatTime(at)}</span>
        </div>
      </div>
    </article>
  );
}
