'use client';

import { useEffect, useState } from 'react';
import { FileSearch, Sparkles } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { ResultsDisplay } from '@/components/predictions/ResultsDisplay';
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
          icon={<Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />}
          eyebrow="Résultat"
          title="Votre prédiction"
          description="Voici le score prédit et les leviers qui ont le plus compté."
        />
        <div className="mt-10">
          {result ? (
            <ResultsDisplay result={result} />
          ) : (
            <div className="card flex flex-col items-center gap-2 py-10 text-center">
              <FileSearch size={28} strokeWidth={1.5} className="text-ink/30" aria-hidden="true" />
              <p className="text-sm text-ink/60">Aucune prédiction à afficher. Lancez-en une nouvelle.</p>
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
