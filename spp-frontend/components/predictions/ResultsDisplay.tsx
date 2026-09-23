'use client';

import { useEffect } from 'react';
import { AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import type { PredictionOutput } from '@/types/prediction';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { FeatureChart } from '@/components/predictions/FeatureChart';
import { useAuth } from '@/hooks/useAuth';
import { useRecommendation } from '@/hooks/useRecommendation';
import { scoreTone } from '@/lib/scoreTone';

type ResultsDisplayProps = {
  result: PredictionOutput;
};

const HUMAN_LABELS: Record<string, string> = {
  Attendance: 'Assiduité',
  Hours_Studied: 'Heures d’étude',
  Previous_Scores: 'Score précédent',
  Tutoring_Sessions: 'Séances de tutorat',
  Access_to_Resources: 'Accès aux ressources',
  Parental_Involvement: 'Implication parentale',
};

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const tone = scoreTone(result.predicted_score);
  const sortedFeatures = Object.entries(result.top_features)
    .map(([key, value]) => ({ key, value, label: HUMAN_LABELS[key] ?? key }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const { token } = useAuth();
  const { loading, error, recommendation, fetchRecommendation } = useRecommendation(token);

  useEffect(() => {
    fetchRecommendation({
      predicted_score: result.predicted_score,
      top_features: result.top_features,
      below_threshold: result.below_threshold,
    });
  }, [fetchRecommendation, result.predicted_score, result.top_features, result.below_threshold]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="card flex flex-col items-center text-center md:col-span-1">
        <div className="eyebrow self-start">Score prédit</div>
        <div className="mt-4">
          <ScoreRing score={result.predicted_score} label={tone.label} tone={tone.tone} />
        </div>
        <p className="mt-4 text-xs text-ink/55">Modèle : {result.model_name}</p>
        <div className="mt-6 w-full">
          <Button href="/predict" secondary fullWidth>
            Nouvelle prédiction
          </Button>
        </div>
      </div>

      <div className="card md:col-span-2">
        <div className="eyebrow flex items-center gap-2">
          <TrendingUp size={14} strokeWidth={2.5} aria-hidden="true" />
          Variables les plus influentes
        </div>
        <h3 className="mt-2 font-display text-2xl text-navy">
          Ce qui compte le plus
        </h3>
        <div className="mt-4">
          <FeatureChart features={sortedFeatures} />
        </div>
      </div>

      <div className="card md:col-span-3">
        <div className="eyebrow flex items-center gap-2">
          <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />
          Recommandation
        </div>
        <h3 className="mt-2 font-display text-2xl text-navy">Analyse personnalisée</h3>
        <div className="mt-4">
          {loading && <Spinner label="Génération de la recommandation…" />}
          {!loading && error && (
            <p className="text-sm text-ink/55">
              Recommandation indisponible pour le moment.
            </p>
          )}
          {!loading && !error && recommendation && (
            <p className="leading-7 text-ink/75">{recommendation}</p>
          )}
        </div>
        <p className="mt-4 text-xs text-ink/45">
          Généré par un modèle de langage à partir de la prédiction ci-dessus. Ce
          n’est ni un diagnostic ni une garantie de résultat.
        </p>
      </div>

      {result.below_threshold.length > 0 && (
        <div className="card md:col-span-3">
          <div className="eyebrow flex items-center gap-2">
            <AlertTriangle size={14} strokeWidth={2.5} aria-hidden="true" />
            Points d’attention
          </div>
          <h3 className="mt-2 font-display text-2xl text-navy">
            Variables sous le seuil recommandé
          </h3>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {result.below_threshold.map((name) => (
              <li key={name} className="rounded-xl bg-sky px-4 py-3 text-sm text-navy">
                {HUMAN_LABELS[name] ?? name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
