'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { ResultsDisplay } from '@/components/predictions/ResultsDisplay';
import { Spinner } from '@/components/ui/Spinner';
import type { PredictionOutput } from '@/types/prediction';

function ResultInner() {
  const [result, setResult] = useState<PredictionOutput | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('spp:lastPrediction');
      if (raw) setResult(JSON.parse(raw) as PredictionOutput);
    } catch {
      setResult(null);
    }
  }, []);

  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          eyebrow="Résultat"
          title="Votre prédiction"
          description="Voici le score prédit et les leviers qui ont le plus compté."
        />
        <div className="mt-10">
          {result ? (
            <ResultsDisplay result={result} />
          ) : (
            <div className="card flex items-center gap-3">
              <Spinner label="Aucune prédiction à afficher. Lancez-en une nouvelle." />
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

export default function ResultPage() {
  return (
    <ProtectedRoute role="student" redirectTo="/login">
      <ResultInner />
    </ProtectedRoute>
  );
}
