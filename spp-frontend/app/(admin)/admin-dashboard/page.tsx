'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExportButton } from '@/components/admin/ExportButton';
import { PredictionsTable } from '@/components/admin/PredictionsTable';
import { useEmailLookup } from '@/components/admin/useEmailLookup';
import { Banner } from '@/components/ui/Banner';
import { CountUp } from '@/components/ui/CountUp';
import { Reveal } from '@/components/ui/Reveal';
import { useAdminPredictions, useAdminUsers } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useInView } from '@/hooks/useInView';
import { firstNameFromEmail } from '@/lib/format';
import { newestFirst } from '@/lib/predictions';
import { TONE_VARS, scoreTone, type ScoreTone } from '@/lib/scoreTone';
import { useI18n } from '@/lib/i18n';

const TIERS: { tone: ScoreTone; label: string; bound: string }[] = [
  { tone: 'excellent', label: 'Excellent', bound: '≥ 80' },
  { tone: 'good', label: 'Bon', bound: '≥ 65' },
  { tone: 'warning', label: 'À renforcer', bound: '≥ 50' },
  { tone: 'risk', label: 'Risque', bound: '< 50' },
];

const WEEK_MS = 7 * 86_400_000;

function Distribution({ counts, total }: { counts: Record<ScoreTone, number>; total: number }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const { t } = useI18n();
  return (
    <div ref={ref} className="dist" role="img" aria-label={t('Répartition par palier')}>
      {TIERS.filter((tier) => counts[tier.tone] > 0).map((tier) => (
        <i key={tier.tone} title={t(tier.label)} style={{ flex: inView ? counts[tier.tone] : 0, background: TONE_VARS[tier.tone] }}>
          {Math.round((counts[tier.tone] / total) * 100)} %
        </i>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t, locale } = useI18n();
  const { user, token } = useAuth();
  const predictions = useAdminPredictions(token);
  const users = useAdminUsers(token);
  const emailOf = useEmailLookup(users.users);
  const [now] = useState(Date.now);

  const records = useMemo(() => newestFirst(predictions.records), [predictions.records]);
  const stats = useMemo(() => {
    const scores = records.map((r) => Number(r.predicted_score));
    const counts: Record<ScoreTone, number> = { excellent: 0, good: 0, warning: 0, risk: 0 };
    scores.forEach((s) => (counts[scoreTone(s).tone] += 1));
    return {
      average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      week: records.filter((r) => now - new Date(r.created_at).getTime() < WEEK_MS).length,
      counts,
    };
  }, [records, now]);

  const students = users.users.filter((u) => u.role === 'student').length;
  const loading = predictions.loading || users.loading;
  const error = predictions.error ?? users.error;
  const name = user ? firstNameFromEmail(user.email, locale) : '';

  const kpis = [
    { label: t('Étudiants'), value: students, decimals: 0, caption: t('comptes étudiants') },
    { label: t('Prédictions'), value: records.length, decimals: 0, caption: t('au total') },
    { label: t('Score moyen'), value: stats.average, decimals: 1, caption: t('sur 100') },
    { label: t('Cette semaine'), value: stats.week, decimals: 0, caption: t('prédictions sur 7 jours') },
  ];

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-h">
          <div>
            <span className="eyebrow">{t('Administration')}</span>
            <h1 className="display" style={{ marginTop: '.7rem' }}>
              {t('Bonjour, {name}.', { name })}<br />
              <span className="muted" style={{ fontWeight: 400 }}>{t('La plateforme en un coup d’œil.')}</span>
            </h1>
          </div>
          <ExportButton records={records} emailOf={emailOf} ghost />
        </div>

        {error && (
          <Banner tone="risk" title={t('Données indisponibles')} className="err-banner-inline">
            {t(error)}
          </Banner>
        )}

        {loading ? (
          <p className="muted">{t('Chargement des indicateurs…')}</p>
        ) : (
          <>
            <div className="kpis">
              {kpis.map((k, i) => (
                <Reveal key={k.label} className="card kpi" delay={i * 0.07}>
                  <small>{k.label}</small>
                  <b>
                    <CountUp value={k.value} decimals={k.decimals} />
                  </b>
                  <span className="muted tiny">{k.caption}</span>
                </Reveal>
              ))}
            </div>

            <Reveal as="article" className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-h">
                <div>
                  <h3 className="display">{t('Répartition des scores')}</h3>
                  <p>{t('Part de chaque palier sur l’ensemble des prédictions.')}</p>
                </div>
              </div>
              {records.length > 0 ? (
                <Distribution counts={stats.counts} total={records.length} />
              ) : (
                <p className="muted">{t('Aucune prédiction pour l’instant.')}</p>
              )}
              <div className="row" style={{ marginTop: '.8rem', ['--g' as string]: '1.2rem' }}>
                {TIERS.map((tier) => (
                  <span key={tier.tone} className="tiny muted">
                    <i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: TONE_VARS[tier.tone], marginRight: '.4rem' }} />
                    {t(tier.label)} {tier.bound}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal as="article" className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-h">
                <div>
                  <h3 className="display">{t('Dernières prédictions')}</h3>
                </div>
                <Link className="link tiny" href="/predictions">
                  {t('Tout voir')}
                </Link>
              </div>
              <PredictionsTable records={records.slice(0, 5)} emailOf={emailOf} emptyText={t('Aucune prédiction pour l’instant.')} />
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
}
