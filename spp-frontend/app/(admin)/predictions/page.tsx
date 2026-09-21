'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { PredictionTable } from '@/components/predictions/PredictionTable';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPredictions } from '@/hooks/useAdmin';

function AdminPredictions() {
  const { token } = useAuth();
  const { records, loading, error, refresh } = useAdminPredictions(token);
  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          eyebrow="Supervision"
          title="Toutes les prédictions"
          description="Liste complète des prédictions effectuées via l’API."
        />
        <div className="mt-10">
          <PredictionTable
            records={records}
            loading={loading}
            error={error}
            emptyMessage="Aucune prédiction à superviser pour le moment."
            showUser
            onRefresh={refresh}
          />
        </div>
      </section>
    </AppShell>
  );
}

export default function AdminPredictionsPage() {
  return (
    <ProtectedRoute role="admin" redirectTo="/login">
      <AdminPredictions />
    </ProtectedRoute>
  );
}
