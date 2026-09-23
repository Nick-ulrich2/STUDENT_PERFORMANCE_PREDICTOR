'use client';

import { ShieldCheck, Users, Zap } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPredictions } from '@/hooks/useAdmin';

function AdminDashboard() {
  const { token, user } = useAuth();
  const { records, loading, error } = useAdminPredictions(token);
  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          icon={<ShieldCheck size={14} strokeWidth={2.5} aria-hidden="true" />}
          eyebrow={`Administration · ${user?.email ?? ''}`}
          title="Vue d’ensemble"
          description="Supervisez l’ensemble des prédictions générées par les étudiants."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <Users size={14} strokeWidth={2.5} aria-hidden="true" />
              Total prédictions
            </div>
            <p className="mt-2 font-display text-4xl text-navy">{records.length}</p>
            <p className="mt-1 text-sm text-ink/60">
              {loading ? 'Chargement…' : error ? 'Indisponible' : 'tous utilisateurs confondus'}
            </p>
          </div>
          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <Zap size={14} strokeWidth={2.5} aria-hidden="true" />
              Action rapide
            </div>
            <p className="mt-2 text-ink/75">Consultez la liste détaillée des prédictions.</p>
            <div className="mt-4">
              <Button href="/predictions">Voir la liste</Button>
            </div>
          </div>
          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <ShieldCheck size={14} strokeWidth={2.5} aria-hidden="true" />
              Accès
            </div>
            <p className="mt-2 text-ink/75">
              Cette section est réservée aux comptes avec le rôle <strong>admin</strong>,
              vérifié côté serveur sur chaque requête.
            </p>
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
