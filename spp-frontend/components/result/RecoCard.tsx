'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRecommendation } from '@/hooks/useRecommendation';
import { tween, EASE } from '@/lib/motion';
import { formatNumber } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import type { PredictionOutput } from '@/types/prediction';

const wordCount = (text: string) => text.trim().split(/\s+/).length;

// The LLM only ever receives the already-computed prediction (see
// POST /predict/recommendation): it explains the score, it never changes it.
export function RecoCard({ output }: { output: PredictionOutput }) {
  const { t, locale } = useI18n();
  const { token } = useAuth();
  const { loading, error, recommendation, fetchRecommendation } = useRecommendation(token);
  const [typed, setTyped] = useState(0);
  const [seconds, setSeconds] = useState<number | null>(null);
  const startedAt = useRef(0);

  const send = useCallback(() => {
    startedAt.current = performance.now();
    fetchRecommendation({
      predicted_score: output.predicted_score,
      top_features: output.top_features,
      below_threshold: output.below_threshold,
    });
  }, [fetchRecommendation, output]);

  useEffect(() => {
    send();
  }, [send]);

  useEffect(() => {
    if (!recommendation) return;
    const elapsed = (performance.now() - startedAt.current) / 1000;
    const total = recommendation.length;
    const anim = tween(Math.min(4200, total * 26), (p) => setTyped(Math.round(total * p)), { ease: EASE.linear });
    anim.done.then(() => setSeconds(elapsed));
    return () => anim.cancel();
  }, [recommendation]);

  const typing = recommendation !== null && typed < recommendation.length;

  return (
    <article className="reco" aria-live="polite">
      <div className="by">
        <span className="pill ink">
          <Sparkles size={14} aria-hidden="true" /> {t('Conseil')}
        </span>
        <span className="tiny muted">{t('écrit par l’assistant IA')}</span>
      </div>

      <div className="hand" id="reco-body">
        {loading && (
          <>
            <div className="skel" style={{ width: '96%' }} />
            <div className="skel" style={{ width: '88%' }} />
            <div className="skel" style={{ width: '60%' }} />
          </>
        )}
        {!loading && error && (
          <>
            <div className="banner risk" role="alert" style={{ background: '#fff', boxShadow: 'none', fontFamily: 'var(--f-body)', fontSize: '.92rem', fontWeight: 400 }}>
              <span className="ic">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <div>
                <b>{t('Le conseil est indisponible')}</b>
                {t('Le service d’explication ne répond pas ou n’est pas configuré.')} <u>{t('Votre score n’est pas affecté.')}</u>
              </div>
            </div>
            <button type="button" className="btn sm" style={{ marginTop: '.8rem', fontFamily: 'var(--f-body)' }} onClick={send}>
              {t('Réessayer')}
            </button>
          </>
        )}
        {recommendation && (
          <>
            <span className="rt">{recommendation.slice(0, typed)}</span>
            {typing && <span className="caret" />}
          </>
        )}
      </div>

      <div className="row" style={{ marginTop: '1rem', ['--g' as string]: '.5rem' }}>
        {recommendation && !typing && (
          <>
            <span className="pill">{wordCount(recommendation)} {t('mots')}</span>
            {seconds !== null && <span className="pill">{t('généré en {seconds} s', { seconds: formatNumber(seconds, 1, locale) })}</span>}
          </>
        )}
      </div>
    </article>
  );
}
