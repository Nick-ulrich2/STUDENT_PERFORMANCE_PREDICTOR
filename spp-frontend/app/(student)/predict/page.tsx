'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { PredictionForm } from '@/components/predictions/PredictionForm';
import { useAuth } from '@/hooks/useAuth';

function PredictPage() {
  const { token } = useAuth();
  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          eyebrow="Prédiction"
          title="Décrivez vos habitudes"
          description="Le modèle renvoie un score prédit, les variables influentes, et les points d’attention."
        />
        <div className="mt-10 mx-auto max-w-3xl">
          <PredictionForm token={token} />
        </div>
      </section>
    </AppShell>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student" redirectTo="/login">
      <PredictPage />
    </ProtectedRoute>
  );
}
