'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Banner } from '@/components/ui/Banner';
import { CountUp } from '@/components/ui/CountUp';
import { BelowChips, TierPill } from '@/components/ui/Pill';
import { Highlight, Reveal } from '@/components/ui/Reveal';
import { Spark } from '@/components/ui/Spark';
import { useAuth } from '@/hooks/useAuth';
import { usePredictionHistory } from '@/hooks/usePredictionHistory';
import { FEATURES, LEVELS_FR, type FeatureKey } from '@/lib/features';
import { formatNumber, formatTime, relativeDay } from '@/lib/format';
import { modelLabel, newestFirst } from '@/lib/predictions';
import { scoreTone } from '@/lib/scoreTone';
import type { PredictionRecord, ResourceLevel } from '@/types/prediction';
import { useI18n } from '@/lib/i18n';

const FIELD_OF: Record<FeatureKey, keyof PredictionRecord> = {
  Attendance: 'attendance',
  Hours_Studied: 'hours_studied',
  Previous_Scores: 'previous_scores',
  Tutoring_Sessions: 'tutoring_sessions',
  Access_to_Resources: 'access_to_resources',
  Parental_Involvement: 'parental_involvement',
};

function VariableValue({ record, featureKey }: { record: PredictionRecord; featureKey: FeatureKey }) {
  const { t, locale } = useI18n();
  const raw = record[FIELD_OF[featureKey]];
  const def = FEATURES.find((f) => f.key === featureKey)!;
  if (def.categorical) return <>{t(LEVELS_FR[raw as ResourceLevel])}</>;
  return (
    <>
      {formatNumber(Number(raw), featureKey === 'Hours_Studied' ? 1 : 0, locale)}
      {def.unit === '%' ? ' %' : ''}
    </>
  );
}

export default function HistoryPage() {
  const { t, locale } = useI18n();
  const { token } = useAuth();
  const { records, loading, error } = usePredictionHistory(token);
  const [openId, setOpenId] = useState<number | null>(null);

  const list = useMemo(() => newestFirst(records), [records]);
  const scores = useMemo(() => [...list].reverse().map((r) => Number(r.predicted_score)), [list]);

  if (loading) {
    return (
      <div className="page">
        <div className="wrap">
          <p className="muted">{t('Chargement de votre historique…')}</p>
        </div>
      </div>
    );
  }

  const header = (title: React.ReactNode, action = true) => (
    <div className="page-h">
      <div>
        <span className="eyebrow">{t('Historique')}</span>
        <h1 className="display" style={{ marginTop: '.7rem' }}>
          {title}
        </h1>
      </div>
      {action && (
        <Link className="btn" href="/predict">
          {t('Nouvelle estimation')} <ArrowRight className="ar" size={18} aria-hidden="true" />
        </Link>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="page">
        <div className="wrap">
          {header(t('Votre historique.'), false)}
          <Banner tone="risk" title={t('Historique indisponible')}>
            {t(error)}
          </Banner>
        </div>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="page">
        <div className="wrap">
          {header(t('Votre historique.'), false)}
          <div className="card empty">
            <svg viewBox="0 0 140 100" fill="none" stroke="var(--line-2)" strokeWidth="3" strokeLinecap="round" width="140" aria-hidden="true">
              <path d="M10 80h120M20 70l25-18 25 10 30-32 20 10" />
              <circle cx="115" cy="40" r="5" fill="var(--mark)" stroke="var(--ink)" />
            </svg>
            <h3 className="display">{t('Aucune estimation pour l’instant')}</h3>
            <p className="muted" style={{ maxWidth: '26rem' }}>
              {t('Chaque estimation sera sauvegardée ici, avec sa date, son score et ses variables sous le seuil.')}
            </p>
            <Link className="btn" href="/predict">
              {t('Faire ma première estimation')} <ArrowRight className="ar" size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const latest = Number(list[0].predicted_score);
  const best = Math.max(...scores);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const trend = scores[scores.length - 1] - scores[0];

  return (
    <div className="page">
      <div className="wrap">
        {header(
          <>
            {t('Votre')} <Highlight>{t('progression')}</Highlight>.
          </>,
        )}

        <div className="kpis k3" style={{ marginBottom: '1.25rem' }}>
          <Reveal className="card kpi">
            <small>{t('Dernière')}</small>
            <b>
              <CountUp value={latest} decimals={1} />
            </b>
            <TierPill score={latest} />
          </Reveal>
          <Reveal className="card kpi" delay={0.07}>
            <small>{t('Meilleure')}</small>
            <b>
              <CountUp value={best} decimals={1} />
            </b>
            <span className="muted tiny">{t(scores.length > 1 ? 'sur {count} estimations' : 'sur {count} estimation', { count: scores.length })}</span>
          </Reveal>
          <Reveal className="card kpi" delay={0.14}>
            <small>{t('Évolution')}</small>
            <b style={{ color: trend >= 0 ? 'var(--excellent)' : 'var(--risk)' }}>
              {trend >= 0 ? '+' : '−'}
              {formatNumber(Math.abs(trend), 1, locale)}
            </b>
            <span className="muted tiny">{t('points depuis la première')}</span>
          </Reveal>
        </div>

        <Reveal as="article" className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-h">
            <div>
              <h3 className="display">{t('Courbe des estimations')}</h3>
              <p>{t('Moyenne {avg} · du plus ancien au plus récent', { avg: formatNumber(average, 1, locale) })}</p>
            </div>
          </div>
          <Spark values={scores} height={110} />
        </Reveal>

        <div className="hist">
          {list.map((r, i) => {
            const score = Number(r.predicted_score);
            const open = openId === r.id;
            return (
              <Reveal key={r.id} delay={Math.min(i, 6) * 0.04}>
                <button
                  type="button"
                  className={`h-i ${scoreTone(score).className}`}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : r.id)}
                >
                  <span className="sc">
                    {formatNumber(score, 1, locale)}
                    <small>/100</small>
                  </span>
                  <span>
                    <b>{relativeDay(r.created_at, locale)}</b>
                    <br />
                    <span className="muted tiny">
                      {formatTime(r.created_at, locale)} · {t('modèle {model}', { model: modelLabel(r) })}
                    </span>
                  </span>
                  <span className="pill-col row" style={{ ['--g' as string]: '.4rem' }}>
                    <TierPill score={score} />
                    {r.below_threshold && r.below_threshold.length > 0 ? (
                      <BelowChips keys={r.below_threshold} />
                    ) : (
                      <span className="pill excellent">{t('Tout est au vert')}</span>
                    )}
                  </span>
                </button>
                {open && (
                  <div className="h-det">
                    {FEATURES.map((f) => (
                      <div key={f.key}>
                        {t(f.label)}
                        <b>
                          <VariableValue record={r} featureKey={f.key} />
                        </b>
                      </div>
                    ))}
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
