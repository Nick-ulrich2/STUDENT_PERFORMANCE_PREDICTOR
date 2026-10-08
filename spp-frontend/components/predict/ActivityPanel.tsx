'use client';

import Link from 'next/link';
import { Banner } from '@/components/ui/Banner';
import { FeatureTile } from '@/components/ui/FeatureTile';
import { ThresholdList } from '@/components/predict/ThresholdList';
import { FEATURES } from '@/lib/features';
import type { AggregatedFeatures } from '@/types/activity';

type ActivityPanelProps = {
  features: AggregatedFeatures | null;
  error: string | null;
  errorStatus: number | null;
  loading: boolean;
  busy: boolean;
  onPredict: () => void;
};

export function ActivityPanel({ features, error, errorStatus, loading, busy, onPredict }: ActivityPanelProps) {
  const incomplete = errorStatus === 409;
  const blocked = loading || features === null;

  return (
    <div className="pform">
      <div className="card">
        <div className="card-h">
          <div>
            <h3 className="display">Votre activité des 7 derniers jours</h3>
            <p>Aucune saisie : SPP lit votre suivi et calcule les 6 variables pour vous.</p>
          </div>
        </div>
        {incomplete && (
          <Banner
            tone="warn"
            title="Données du suivi incomplètes (409)"
            className="err-banner-inline"
            action={
              <Link className="btn sm ghost" href="/tracking">
                Compléter
              </Link>
            }
          >
            Marquez votre présence au moins un jour sur les 7 derniers et renseignez votre profil (note précédente, ressources, implication).
          </Banner>
        )}
        {error && !incomplete && (
          <Banner tone="risk" title="Suivi indisponible" className="err-banner-inline">
            {error}
          </Banner>
        )}
        <div className="tiles">
          {FEATURES.map((f) => (
            <FeatureTile key={f.key} featureKey={f.key} value={features?.[f.key] ?? null} />
          ))}
        </div>
      </div>
      <aside className="sticky-side stack" style={{ ['--s' as string]: '1rem' }}>
        <div className="card">
          <h3 className="display" style={{ fontSize: '1.25rem' }}>
            Seuils recommandés
          </h3>
          <div style={{ marginTop: '.6rem' }}>
            <ThresholdList values={features ?? {}} />
          </div>
        </div>
        <button
          type="button"
          className={`btn block lg${blocked ? ' is-disabled' : ''}`}
          aria-disabled={blocked}
          disabled={blocked || busy}
          onClick={onPredict}
        >
          Prédire depuis mon activité <span className="ar" aria-hidden="true">→</span>
        </button>
      </aside>
    </div>
  );
}
