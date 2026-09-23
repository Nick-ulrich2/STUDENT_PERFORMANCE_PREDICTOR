'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarCheck, History, LayoutDashboard, Users, Zap } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Button } from '@/components/ui/Button';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { IconRingTile } from '@/components/ui/IconRingTile';
import { ActivityHeatmap } from '@/components/ui/ActivityHeatmap';
import { useAuth } from '@/hooks/useAuth';
import { usePredictionHistory } from '@/hooks/usePredictionHistory';
import { useActivities } from '@/hooks/useActivities';
import { buildHeatmap, computeStreak, hasActivityTodayOfType } from '@/lib/streak';

function StudentDashboard() {
  const { user, token } = useAuth();
  const { records, loading, error } = usePredictionHistory(token);
  const { activities } = useActivities(token);

  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          icon={<LayoutDashboard size={14} strokeWidth={2.5} aria-hidden="true" />}
          eyebrow={`Bonjour ${user?.email ?? ''}`}
          title="Votre tableau de bord"
          description="Lancez une prédiction ou consultez vos résultats précédents."
          aside={<StreakBadge days={computeStreak(activities)} />}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="card card-hover">
            <div className="eyebrow">Prédictions</div>
            <p className="mt-2 font-display text-4xl text-navy">{records.length}</p>
            <p className="mt-1 text-sm text-ink/60">
              {loading ? 'Chargement…' : error ? 'Indisponible' : 'enregistrées'}
            </p>
            <div className="mt-3 h-1 w-10 rounded-full bg-teal" />
          </div>
          <div className="card card-hover">
            <div className="eyebrow flex items-center gap-2">
              <Zap size={14} strokeWidth={2.5} aria-hidden="true" />
              Action rapide
            </div>
            <p className="mt-2 text-ink/75">Lancez une nouvelle prédiction en quelques secondes.</p>
            <div className="mt-4"><Button href="/predict">Nouvelle prédiction</Button></div>
            <div className="mt-3 h-1 w-10 rounded-full bg-navy" />
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
            <div className="mt-3 h-1 w-10 rounded-full bg-amber" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="card md:col-span-1">
            <div className="eyebrow">Aujourd’hui</div>
            <h3 className="mt-1 font-display text-xl text-navy">Vue d’ensemble</h3>
            <div className="mt-6 flex justify-around">
              <IconRingTile
                icon={BookOpen}
                label="Étude"
                done={hasActivityTodayOfType(activities, 'study_session')}
              />
              <IconRingTile
                icon={Users}
                label="Tutorat"
                done={hasActivityTodayOfType(activities, 'tutoring_session')}
              />
              <IconRingTile
                icon={CalendarCheck}
                label="Assiduité"
                done={hasActivityTodayOfType(activities, 'attendance')}
              />
            </div>
          </div>
          <div className="card md:col-span-2">
            <div className="eyebrow">Régularité</div>
            <h3 className="mt-1 font-display text-xl text-navy">10 dernières semaines</h3>
            <div className="mt-6">
              <ActivityHeatmap days={buildHeatmap(activities, 10)} />
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute role="student" redirectTo="/login">
      <StudentDashboard />
    </ProtectedRoute>
  );
}
