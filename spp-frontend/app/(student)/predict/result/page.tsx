'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Importance } from '@/components/result/Importance';
import { RecoCard } from '@/components/result/RecoCard';
import { SaveStatus, type SaveState } from '@/components/result/SaveStatus';
import { ScoreSheet } from '@/components/result/ScoreSheet';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { loadLastPrediction } from '@/lib/lastPrediction';
import { useT } from '@/lib/i18n';

const SAVED_WINDOW_MS = 10 * 60_000;

function ResultView() {
  const { token } = useAuth();
  const t = useT();
  const [last] = useState(loadLastPrediction);
  const [save, setSave] = useState<{ state: SaveState; count: number | null }>({ state: 'checking', count: null });

  // The API returns the score whether or not the database accepted the write,
  // so "saved" is verified against the history rather than assumed.
  useEffect(() => {
    if (!last || !token) return;
    const controller = new AbortController();
    api.getMyPredictions({ token, signal: controller.signal }).then((response) => {
      if (controller.signal.aborted) return;
      if (!response.ok) return setSave({ state: 'missing', count: null });
      const found = response.data.some(
        (r) =>
          Math.abs(Number(r.predicted_score) - last.output.predicted_score) < 0.01 &&
          Math.abs(new Date(r.created_at).getTime() - last.at) < SAVED_WINDOW_MS,
      );
      setSave({ state: found ? 'saved' : 'missing', count: found ? response.data.length : null });
    });
    return () => controller.abort();
  }, [last, token]);

  if (!last) {
    return (
      <div className="page">
        <div className="wrap">
          <div className="empty">
            <h2 className="display">{t('Aucune estimation à afficher.')}</h2>
            <Link className="btn" href="/predict">
              {t('Estimer ma note')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-h">
          <div>
            <span className="eyebrow">{t('Résultat')}</span>
            <h1 className="display" style={{ marginTop: '.7rem' }}>
              {t('Votre copie est corrigée.')}
            </h1>
          </div>
          <div className="row">
            <Link className="btn ghost" href="/predict">
              {t('Refaire une estimation')}
            </Link>
            <Link className="btn" href="/history">
              {t('Mon historique')} <ArrowRight className="ar" size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="result">
          <div className="stack" style={{ ['--s' as string]: '1.5rem' }}>
            <ScoreSheet score={last.output.predicted_score} at={last.at} copyNumber={save.count} />
            <Importance output={last.output} vars={last.vars} />
          </div>
          <div className="stack" style={{ ['--s' as string]: '1.5rem' }}>
            <RecoCard output={last.output} />
            <p className="tiny muted" style={{ maxWidth: '30rem' }}>
              {t('L’assistant ne reçoit que votre score et les variables sous le seuil. Il ne voit pas vos données brutes et ne peut pas modifier votre note.')}
            </p>
            <SaveStatus state={save.state} modelName={last.output.model_name} at={last.at} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultView;
