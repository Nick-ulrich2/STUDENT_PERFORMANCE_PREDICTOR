'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Target } from 'lucide-react';
import { Banner } from '@/components/ui/Banner';
import { CountUp } from '@/components/ui/CountUp';
import { FeatureTile } from '@/components/ui/FeatureTile';
import { Heatmap } from '@/components/ui/Heatmap';
import { Reveal } from '@/components/ui/Reveal';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TierPill } from '@/components/ui/Pill';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useFeatures } from '@/hooks/useFeatures';
import { usePredictionHistory } from '@/hooks/usePredictionHistory';
import { FEATURES } from '@/lib/features';
import { firstNameFromEmail, formatNumber, relativeDay } from '@/lib/format';
import { newestFirst, modelLabel } from '@/lib/predictions';
import { priorityAction } from '@/lib/priority';
import { buildHeatmap, computeStreak } from '@/lib/streak';

const WEEKS = 18;

export default function StudentDashboardPage() {
  const { user, token } = useAuth();
  const history = usePredictionHistory(token);
  const features = useFeatures(token);
  const { activities } = useActivities(token);

  const records = useMemo(() => newestFirst(history.records), [history.records]);
  const last = records[0];
  const previous = records[1];
  const delta = last && previous ? Math.round((last.predicted_score - previous.predicted_score) * 10) / 10 : null;
  const action = priorityAction(features.features);
  const heat = useMemo(() => buildHeatmap(activities, WEEKS), [activities]);

  const streaks = [
    { label: 'Étude', days: computeStreak(activities, (a) => a.activity_type === 'study_session') },
    { label: 'Tutorat', days: computeStreak(activities, (a) => a.activity_type === 'tutoring_session') },
    { label: 'Présence', days: computeStreak(activities, (a) => a.activity_type === 'attendance' && a.status === 'present') },
  ];

  const name = user ? firstNameFromEmail(user.email) : '';
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const trackingIncomplete = features.errorStatus === 409;

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-h">
          <div>
            <span className="eyebrow">{today}</span>
            <h1 className="display" style={{ marginTop: '.7rem' }}>
              Bonjour, {name}.<br />
              <span className="muted" style={{ fontWeight: 400 }}>Voici où vous en êtes.</span>
            </h1>
          </div>
          <Link className="btn" href="/predict">
            Nouvelle estimation <ArrowRight className="ar" size={18} aria-hidden="true" />
          </Link>
        </div>

        {history.error && (
          <Banner tone="risk" title="Historique indisponible" className="err-banner-inline">
            {history.error}
          </Banner>
        )}

        <div className="dash">
          <Reveal as="article" className="card c7">
            {history.loading ? (
              <p className="muted">Chargement de votre dernière estimation…</p>
            ) : last ? (
              <>
                <div className="card-h">
                  <div>
                    <h3 className="display">Votre dernière estimation</h3>
                    <p>
                      {relativeDay(last.created_at)} · modèle {modelLabel(last)}
                    </p>
                  </div>
                  <TierPill score={last.predicted_score} />
                </div>
                <div className="bigscore">
                  <ScoreRing score={last.predicted_score} size={200} decimals={1} />
                  <div className="stack" style={{ ['--s' as string]: '.7rem' }}>
                    {delta !== null && (
                      <div>
                        <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
                          {delta >= 0 ? '▲ +' : '▼ −'}
                          {formatNumber(Math.abs(delta), 1)} pt
                        </span>{' '}
                        <span className="muted tiny">depuis la précédente</span>
                      </div>
                    )}
                    <p className="muted">
                      Marge d’erreur typique de <b style={{ color: 'var(--ink)' }}>± 2 points</b>. Une estimation se lit comme un repère, pas comme un résultat garanti.
                    </p>
                    <Link className="link" href="/history">
                      Voir l’historique
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty" style={{ padding: '2rem 0' }}>
                <h3 className="display">Aucune estimation pour l’instant</h3>
                <p className="muted" style={{ maxWidth: '26rem' }}>
                  Faites votre première estimation : elle servira de point de départ à toute votre progression.
                </p>
                <Link className="btn" href="/predict">
                  Estimer ma note <ArrowRight className="ar" size={18} aria-hidden="true" />
                </Link>
              </div>
            )}
          </Reveal>

          <Reveal as="article" className="card priority c5" delay={0.08}>
            <span className="pill tag">
              <Target size={14} aria-hidden="true" /> Action prioritaire
            </span>
            <h3 className="display">{action.title}</h3>
            <p>{action.text}</p>
            <Link className="btn mark" style={{ marginTop: '1.2rem', position: 'relative', zIndex: 1 }} href={action.href}>
              {action.cta} <ArrowRight className="ar" size={18} aria-hidden="true" />
            </Link>
          </Reveal>

          <Reveal as="article" className="card c8">
            <div className="card-h">
              <div>
                <h3 className="display">Cette semaine</h3>
                <p>Vos 6 variables, agrégées sur 7 jours glissants. Le repère rouge marque le seuil recommandé.</p>
              </div>
              <Link className="link tiny" href="/tracking">
                Détail
              </Link>
            </div>
            {trackingIncomplete && (
              <Banner
                tone="warn"
                title="Suivi incomplet"
                className="err-banner-inline"
                action={
                  <Link className="btn sm ghost" href="/tracking">
                    Compléter
                  </Link>
                }
              >
                Marquez votre présence au moins un jour et complétez votre profil.
              </Banner>
            )}
            {features.error && !trackingIncomplete && (
              <Banner tone="risk" title="Suivi indisponible" className="err-banner-inline">
                {features.error}
              </Banner>
            )}
            <div className="tiles">
              {FEATURES.map((f) => (
                <FeatureTile key={f.key} featureKey={f.key} value={features.features?.[f.key] ?? null} />
              ))}
            </div>
          </Reveal>

          <Reveal as="article" className="card c4" delay={0.08}>
            <div className="card-h">
              <div>
                <h3 className="display">Séries</h3>
                <p>Jours consécutifs par activité.</p>
              </div>
            </div>
            <div className="streaks">
              {streaks.map((s) => (
                <div key={s.label} className={`streak${s.days ? '' : ' zero'}`}>
                  <div className="flame">
                    <Flame size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="n">
                      <CountUp value={s.days} duration={800} />{' '}
                      <span style={{ fontSize: '.9rem', fontFamily: 'var(--f-body)', fontWeight: 500 }}>jour{s.days > 1 ? 's' : ''}</span>
                    </div>
                    <div className="t">
                      {s.label}
                      {s.days ? '' : ' · reprenez aujourd’hui'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="article" className="card c12">
            <div className="card-h">
              <div>
                <h3 className="display">Carte de chaleur</h3>
                <p>Vos {WEEKS * 7} derniers jours d’activité. Plus la case est foncée, plus la journée a été active.</p>
              </div>
            </div>
            <Heatmap days={heat} weeks={WEEKS} label={`Carte de chaleur d’activité sur ${WEEKS} semaines`} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
