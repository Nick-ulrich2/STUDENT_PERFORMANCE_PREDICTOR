'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { PredictionTable } from '@/components/predictions/PredictionTable';
import { useAuth } from '@/hooks/useAuth';
import { usePredictionHistory } from '@/hooks/usePredictionHistory';

function HistoryInner() {
  const { token } = useAuth();
  const { records, loading, error, refresh } = usePredictionHistory(token);
  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          eyebrow="Historique"
          title="Vos prédictions passées"
          description="Consultez la liste complète des prédictions enregistrées pour votre compte."
        />
        <div className="mt-10">
          <PredictionTable
            records={records}
            loading={loading}
            error={error}
            emptyMessage="Aucune prédiction enregistrée pour le moment."
            showUser={false}
            onRefresh={refresh}
          />
        </div>
      </section>
    </AppShell>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute role="student" redirectTo="/login">
      <HistoryInner />
    </ProtectedRoute>
  );
}
