'use client';

import { Download, ListChecks } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Button } from '@/components/ui/Button';
import { PredictionTable } from '@/components/predictions/PredictionTable';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPredictions } from '@/hooks/useAdmin';
import { downloadCsv } from '@/lib/csv';

function AdminPredictions() {
  const { token } = useAuth();
  const { records, loading, error, refresh } = useAdminPredictions(token);

  const handleExport = () => {
    downloadCsv(
      `predictions-${new Date().toISOString().slice(0, 10)}.csv`,
      records.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        date: r.created_at,
        score_predit: r.predicted_score,
        assiduite: r.attendance,
        heures_etude: r.hours_studied,
        score_precedent: r.previous_scores,
        seances_tutorat: r.tutoring_sessions,
        acces_ressources: r.access_to_resources,
        implication_parentale: r.parental_involvement,
      })),
    );
  };

  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          icon={<ListChecks size={14} strokeWidth={2.5} aria-hidden="true" />}
          eyebrow="Supervision"
          title="Toutes les prédictions"
          description="Liste complète des prédictions effectuées via l’API."
          aside={
            records.length > 0 && (
              <Button secondary onClick={handleExport}>
                <Download size={14} strokeWidth={2.5} className="mr-2" aria-hidden="true" />
                Exporter CSV
              </Button>
            )
          }
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
