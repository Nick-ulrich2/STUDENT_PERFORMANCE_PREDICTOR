'use client';

import { BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { AggregatedFeatures } from '@/types/activity';

const LABELS: Record<keyof Omit<AggregatedFeatures, 'window_days' | 'days_logged'>, string> = {
  Attendance: 'Assiduité',
  Hours_Studied: 'Heures d’étude',
  Previous_Scores: 'Score précédent',
  Tutoring_Sessions: 'Séances de tutorat',
  Access_to_Resources: 'Accès aux ressources',
  Parental_Involvement: 'Implication parentale',
};

const FEATURE_KEYS = Object.keys(LABELS) as (keyof typeof LABELS)[];

type Props = {
  features: AggregatedFeatures | null;
  loading: boolean;
  error: string | null;
  predicting: boolean;
  onPredict: () => void;
};

export function WeeklyFeaturesSummary({ features, loading, error, predicting, onPredict }: Props) {
  return (
    <div className="card grid gap-4">
      <div>
        <div className="eyebrow flex items-center gap-2">
          <BarChart3 size={14} strokeWidth={2.5} aria-hidden="true" />
          Cette semaine
        </div>
        <h3 className="mt-1 font-display text-2xl text-navy">Vos habitudes agrégées</h3>
        <p className="mt-1 text-sm text-ink/60">
          Calculées automatiquement à partir de vos activités des 7 derniers jours.
        </p>
      </div>

      {loading && (
        <ul className="grid gap-2 md:grid-cols-2">
          {FEATURE_KEYS.map((key) => (
            <li key={key} className="skeleton h-10 rounded-xl" />
          ))}
        </ul>
      )}
      {!loading && error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && features && (
        <ul className="grid gap-2 text-sm md:grid-cols-2">
          {FEATURE_KEYS.map((key) => (
            <li key={key} className="flex items-center justify-between rounded-xl bg-sky/40 px-4 py-2">
              <span className="text-ink/70">{LABELS[key]}</span>
              <span className="font-bold text-navy">{String(features[key])}</span>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={onPredict} disabled={predicting || loading || Boolean(error)} fullWidth>
        {predicting ? (
          <Spinner label="Prédiction en cours…" />
        ) : (
          <>
            <Sparkles size={14} strokeWidth={2.5} className="mr-2" aria-hidden="true" />
            Lancer la prédiction
          </>
        )}
      </Button>
    </div>
  );
}
