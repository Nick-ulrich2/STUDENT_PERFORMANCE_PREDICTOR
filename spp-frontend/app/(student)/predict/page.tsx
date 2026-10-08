'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ActivityPanel } from '@/components/predict/ActivityPanel';
import { GradingOverlay } from '@/components/predict/GradingOverlay';
import { ManualForm } from '@/components/predict/ManualForm';
import { Banner } from '@/components/ui/Banner';
import { Highlight } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useFeatures } from '@/hooks/useFeatures';
import { useProfileAttributes } from '@/hooks/useProfileAttributes';
import { api } from '@/lib/api';
import { saveLastPrediction } from '@/lib/lastPrediction';
import { sleep } from '@/lib/motion';
import type { ApiResponse } from '@/types/api';
import type { PredictionOutput, StudentInput } from '@/types/prediction';

type Mode = 'manual' | 'activity';
const GRADING_MS = 1300;

function PredictView() {
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();
  const [mode, setMode] = useState<Mode>(useSearchParams().get('mode') === 'activity' ? 'activity' : 'manual');
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const features = useFeatures(token);
  const profile = useProfileAttributes(token);

  const run = async (vars: StudentInput, call: () => Promise<ApiResponse<PredictionOutput>>) => {
    setError(null);
    setGrading(true);
    const [response] = await Promise.all([call(), sleep(GRADING_MS)]);
    setGrading(false);
    if (!response.ok) {
      setError(response.error.detail);
      toast('L’estimation n’a pas pu être calculée.', { error: true });
      return;
    }
    saveLastPrediction({ output: response.data, vars, at: Date.now() });
    router.push('/predict/result');
  };

  const predictManual = (vars: StudentInput) => run(vars, () => api.predict(vars, { token }));

  const predictFromActivity = () => {
    const f = features.features;
    if (!f) return;
    const vars: StudentInput = {
      Attendance: f.Attendance,
      Hours_Studied: f.Hours_Studied,
      Previous_Scores: f.Previous_Scores,
      Tutoring_Sessions: f.Tutoring_Sessions,
      Access_to_Resources: f.Access_to_Resources,
      Parental_Involvement: f.Parental_Involvement,
    };
    return run(vars, () => api.predictFromActivity(7, { token }));
  };

  const initial: StudentInput = {
    Attendance: 80,
    Hours_Studied: 15,
    Previous_Scores: profile.attributes.previous_scores ?? 70,
    Tutoring_Sessions: 1,
    Access_to_Resources: profile.attributes.access_to_resources ?? 'Medium',
    Parental_Involvement: profile.attributes.parental_involvement ?? 'Medium',
  };

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-h">
          <div>
            <span className="eyebrow">Prédiction</span>
            <h1 className="display" style={{ marginTop: '.7rem' }}>
              Estimez <Highlight>votre note</Highlight>.
            </h1>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Source des données">
          <button type="button" role="tab" aria-selected={mode === 'manual'} onClick={() => setMode('manual')}>
            Saisie manuelle
          </button>
          <button type="button" role="tab" aria-selected={mode === 'activity'} onClick={() => setMode('activity')}>
            Depuis mon activité
          </button>
        </div>

        {error && (
          <Banner tone="risk" title="Estimation impossible" className="err-banner-inline">
            {error}
          </Banner>
        )}

        {mode === 'manual' ? (
          profile.loading ? (
            <p className="muted">Chargement…</p>
          ) : (
            <ManualForm initial={initial} busy={grading} onSubmit={predictManual} />
          )
        ) : (
          <ActivityPanel
            features={features.features}
            error={features.error}
            errorStatus={features.errorStatus}
            loading={features.loading}
            busy={grading}
            onPredict={predictFromActivity}
          />
        )}
      </div>
      {grading && <GradingOverlay />}
    </div>
  );
}

export default function PredictPage() {
  return (
    <Suspense fallback={null}>
      <PredictView />
    </Suspense>
  );
}
