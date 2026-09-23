'use client';

import Link from 'next/link';
import { ArrowRight, History, LayoutDashboard, Zap } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { usePredictionHistory } from '@/hooks/usePredictionHistory';

function StudentDashboard() {
  const { user } = useAuth();
  const { records, loading, error } = usePredictionHistory(useAuthToken());
  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          icon={<LayoutDashboard size={14} strokeWidth={2.5} aria-hidden="true" />}
          eyebrow={`Bonjour ${user?.email ?? ''}`}
          title="Votre tableau de bord"
          description="Lancez une prédiction ou consultez vos résultats précédents."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="card card-hover">
            <div className="eyebrow">Prédictions</div>
            <p className="mt-2 font-display text-4xl text-navy">{records.length}</p>
            <p className="mt-1 text-sm text-ink/60">
              {loading ? 'Chargement…' : error ? 'Indisponible' : 'enregistrées'}
            </p>
          </div>
          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <Zap size={14} strokeWidth={2.5} aria-hidden="true" />
              Action rapide
            </div>
            <p className="mt-2 text-ink/75">Lancez une nouvelle prédiction en quelques secondes.</p>
            <div className="mt-4"><Button href="/predict">Nouvelle prédiction</Button></div>
          </div>
          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <History size={14} strokeWidth={2.5} aria-hidden="true" />
              Historique
            </div>
            <p className="mt-2 text-ink/75">Suivez l’évolution de vos scores prédits.</p>
            <div className="mt-4">
              <Link
                href="/history"
                className="inline-flex items-center gap-1 text-sm font-bold text-navy hover:underline"
              >
                Voir l’historique
                <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function useAuthToken(): string | null {
  const { token } = useAuth();
  return token;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute role="student" redirectTo="/login">
      <StudentDashboard />
    </ProtectedRoute>
  );
}
