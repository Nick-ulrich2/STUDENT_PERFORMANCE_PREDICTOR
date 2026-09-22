'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPredictions } from '@/hooks/useAdmin';

function AdminDashboard() {
  const { token } = useAuth();
  const { records, loading, error } = useAdminPredictions(token);
  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          eyebrow="Administration"
          title="Vue d’ensemble"
          description="Supervisez l’ensemble des prédictions générées par les étudiants."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="card">
            <div className="eyebrow">Total prédictions</div>
            <p className="mt-2 font-display text-4xl text-navy">{records.length}</p>
            <p className="mt-1 text-sm text-ink/60">
              {loading ? 'Chargement…' : error ? 'Indisponible' : 'tous utilisateurs confondus'}
            </p>
          </div>
          <div className="card">
            <div className="eyebrow">Action rapide</div>
            <p className="mt-2 text-ink/75">Consultez la liste détaillée des prédictions.</p>
            <div className="mt-4">
              <Button href="/predictions">Voir la liste</Button>
            </div>
          </div>
          <div className="card">
            <div className="eyebrow">Documentation</div>
            <p className="mt-2 text-ink/75">Rôles administrateurs uniquement.</p>
            <div className="mt-4">
              <Link href="/admin-dashboard" className="text-sm font-bold text-navy hover:underline">
                Retour au dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute role="admin" redirectTo="/login">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
