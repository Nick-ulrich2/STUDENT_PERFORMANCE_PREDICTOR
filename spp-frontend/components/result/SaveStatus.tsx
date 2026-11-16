'use client';

import { AlertTriangle, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatTime } from '@/lib/format';

export type SaveState = 'checking' | 'saved' | 'missing';

type SaveStatusProps = { state: SaveState; modelName: string; at: number };

export function SaveStatus({ state, modelName, at }: SaveStatusProps) {
  const { t, locale } = useI18n();
  return (
    <article className="card flat">
      <div className="stack" style={{ ['--s' as string]: '.7rem' }}>
        {state === 'saved' && (
          <div className="save">
            <Check size={18} aria-hidden="true" /> {t('Enregistrée dans votre historique')}
          </div>
        )}
        {state === 'missing' && (
          <>
            <div className="save fail">
              <AlertTriangle size={18} aria-hidden="true" /> {t('Non enregistrée : la base n’a pas confirmé l’écriture')}
            </div>
            <p className="tiny muted">{t('Votre estimation est tout de même affichée. Elle n’apparaîtra pas dans l’historique.')}</p>
          </>
        )}
        {state === 'checking' && <p className="tiny muted">{t('Vérification de l’enregistrement…')}</p>}
        <div className="meta-line">
          <span>{t('modèle {model}', { model: modelName })}</span>
          <span>{formatTime(at, locale)}</span>
        </div>
      </div>
    </article>
  );
}
