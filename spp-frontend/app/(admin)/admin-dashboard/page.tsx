'use client';

import { useMemo } from 'react';
import { BarChart3, ShieldCheck, TrendingUp, Users, Zap } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPredictions } from '@/hooks/useAdmin';
import { scoreTone } from '@/lib/scoreTone';

function AdminDashboard() {
  const { token, user } = useAuth();
  const { records, loading, error } = useAdminPredictions(token);

  const stats = useMemo(() => {
    if (records.length === 0) return null;
    const scores = records.map((r) => Number(r.predicted_score));
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const counts = { excellent: 0, good: 0, warning: 0, risk: 0 };
    scores.forEach((s) => {
      counts[scoreTone(s).tone] += 1;
    });
    return { average, counts };
  }, [records]);

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
            <div className="mt-3 h-1 w-10 rounded-full bg-teal" />
          </div>

          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <TrendingUp size={14} strokeWidth={2.5} aria-hidden="true" />
              Score moyen
            </div>
            <p className="mt-2 font-display text-4xl text-navy">
              {stats ? stats.average.toFixed(1) : '—'}
            </p>
            <p className="mt-1 text-sm text-ink/60">sur 100, toutes prédictions confondues</p>
            <div className="mt-3 h-1 w-10 rounded-full bg-navy" />
          </div>

          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <BarChart3 size={14} strokeWidth={2.5} aria-hidden="true" />
              Répartition
            </div>
            {stats ? (
              <ul className="mt-3 grid gap-1.5 text-sm">
                <li className="flex justify-between">
                  <span className="text-ink/60">Excellent</span>
                  <span className="font-bold text-navy">{stats.counts.excellent}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink/60">Bon</span>
                  <span className="font-bold text-navy">{stats.counts.good}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink/60">À renforcer</span>
                  <span className="font-bold text-navy">{stats.counts.warning}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink/60">Risque</span>
                  <span className="font-bold text-navy">{stats.counts.risk}</span>
                </li>
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink/60">Aucune donnée pour le moment.</p>
            )}
            <div className="mt-3 h-1 w-10 rounded-full bg-amber" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <Zap size={14} strokeWidth={2.5} aria-hidden="true" />
              Prédictions
            </div>
            <p className="mt-2 text-ink/75">
              Consultez, filtrez et exportez la liste détaillée des prédictions.
            </p>
            <div className="mt-4">
              <Button href="/predictions">Voir la liste</Button>
            </div>
          </div>
          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <Users size={14} strokeWidth={2.5} aria-hidden="true" />
              Utilisateurs
            </div>
            <p className="mt-2 text-ink/75">
              Recherchez un compte et gérez les rôles étudiant / admin.
            </p>
            <div className="mt-4">
              <Button href="/admin/users">Gérer les utilisateurs</Button>
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
