'use client';

import { useRouter } from 'next/navigation';
import { Activity, History } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { useProfileAttributes } from '@/hooks/useProfileAttributes';
import { useFeatures, usePredictFromActivity } from '@/hooks/useFeatures';
import { ActivityTimer } from '@/components/activities/ActivityTimer';
import { AttendanceCard } from '@/components/activities/AttendanceCard';
import { ActivityLogList } from '@/components/activities/ActivityLogList';
import { ProfileAttributesForm } from '@/components/activities/ProfileAttributesForm';
import { WeeklyFeaturesSummary } from '@/components/activities/WeeklyFeaturesSummary';
import type { AttendanceStatus, TrackedActivityType } from '@/types/activity';
import { computeStreak, computeStreakForType } from '@/lib/streak';

const TRACKED_TYPES: TrackedActivityType[] = ['study_session', 'tutoring_session'];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function TrackerPage() {
  const router = useRouter();
  const { token } = useAuth();
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    actionError,
    start,
    stop,
    markAttendance,
    correct,
  } = useActivities(token);
  const { attributes, loading: attributesLoading, saving, save } = useProfileAttributes(token);
  const { features, loading: featuresLoading, error: featuresError, refresh: refreshFeatures } =
    useFeatures(token);
  const { submit: predict, loading: predicting, error: predictError } = usePredictFromActivity(token);

  const activeByType = (type: TrackedActivityType) =>
    activities.find((a) => a.activity_type === type && a.status === 'in_progress') ?? null;

  const handleStart = async (type: TrackedActivityType) => {
    await start(type);
    refreshFeatures();
  };

  const handleStop = async (id: number) => {
    await stop(id);
    refreshFeatures();
  };

  const handleMarkAttendance = async (status: AttendanceStatus) => {
    await markAttendance(status, todayIsoDate());
    refreshFeatures();
  };

  const handleCorrect = async (id: number, note: string) => {
    await correct(id, { note });
    refreshFeatures();
  };

  const handleSaveProfile = async (payload: {
    Previous_Scores: number;
    Access_to_Resources: 'Low' | 'Medium' | 'High';
    Parental_Involvement: 'Low' | 'Medium' | 'High';
  }) => {
    await save(payload);
    refreshFeatures();
  };

  const handlePredict = async () => {
    const result = await predict();
    if (result) {
      try {
        sessionStorage.setItem('spp:lastPrediction', JSON.stringify(result));
      } catch {
        // ignore storage errors (private mode, quota)
      }
      router.push('/predict/result');
    }
  };

  return (
    <AppShell>
      <section className="container section-pad">
        <SectionIntro
          icon={<Activity size={14} strokeWidth={2.5} aria-hidden="true" />}
          eyebrow="Suivi d’habitudes"
          title="Enregistrez vos activités"
          description="Démarrez et arrêtez vos sessions au fil de la journée : la prédiction se base sur ce que vous avez réellement fait, pas sur une estimation saisie à la main."
          aside={<StreakBadge days={computeStreak(activities)} />}
        />

        {actionError && (
          <div className="alert alert-error mt-6" role="alert">
            {actionError}
          </div>
        )}
        {activitiesError && (
          <div className="alert alert-error mt-6" role="alert">
            {activitiesError}
          </div>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TRACKED_TYPES.map((type) => (
            <ActivityTimer
              key={type}
              activityType={type}
              active={activeByType(type)}
              busy={activitiesLoading}
              streakDays={computeStreakForType(activities, type)}
              onStart={handleStart}
              onStop={handleStop}
            />
          ))}
          <AttendanceCard activities={activities} busy={activitiesLoading} onMark={handleMarkAttendance} />
        </div>

        <div className="mt-6">
          <h3 className="flex items-center gap-2 font-display text-xl text-navy">
            <History size={18} strokeWidth={2} aria-hidden="true" />
            Historique récent
          </h3>
          <div className="mt-3">
            <ActivityLogList activities={activities} busy={activitiesLoading} onCorrect={handleCorrect} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ProfileAttributesForm
            attributes={attributes}
            saving={saving || attributesLoading}
            onSave={handleSaveProfile}
          />
          <WeeklyFeaturesSummary
            features={features}
            loading={featuresLoading}
            error={featuresError ?? predictError}
            predicting={predicting}
            onPredict={handlePredict}
          />
        </div>
      </section>
    </AppShell>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student" redirectTo="/login">
      <TrackerPage />
    </ProtectedRoute>
  );
}
