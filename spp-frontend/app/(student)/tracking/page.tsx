'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ActivityLog, summary } from '@/components/tracking/ActivityLog';
import { AttendanceCard } from '@/components/tracking/AttendanceCard';
import { CorrectionModal } from '@/components/tracking/CorrectionModal';
import { ProfileForm } from '@/components/tracking/ProfileForm';
import { TimerCard } from '@/components/tracking/TimerCard';
import { WeekBars, type WeekDay } from '@/components/tracking/WeekBars';
import { Banner } from '@/components/ui/Banner';
import { Highlight, Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useFeatures } from '@/hooks/useFeatures';
import { useProfileAttributes } from '@/hooks/useProfileAttributes';
import { formatNumber, startOfDay } from '@/lib/format';
import { dateKey, durationMs } from '@/lib/streak';
import type { ActivityCorrectionPayload, ActivityRecord, AttendanceStatus, TrackedActivityType } from '@/types/activity';

const DAY_MS = 86_400_000;

export default function TrackingPage() {
  const { token } = useAuth();
  const toast = useToast();
  const { activities, loading, error, actionError, start, stop, markAttendance, correct } = useActivities(token);
  const profile = useProfileAttributes(token);
  const features = useFeatures(token);
  const [correcting, setCorrecting] = useState<ActivityRecord | null>(null);

  const live = useMemo(() => activities.filter((a) => a.status !== 'corrected'), [activities]);
  const active = (type: TrackedActivityType) => live.find((a) => a.activity_type === type && a.status === 'in_progress') ?? null;
  const todayAttendance =
    live.find((a) => a.activity_type === 'attendance' && dateKey(new Date(a.started_at)) === dateKey(new Date())) ?? null;

  const week = useMemo<WeekDay[]>(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const day = today - (6 - i) * DAY_MS;
      const hours = live
        .filter((a) => a.activity_type === 'study_session' && a.ended_at && startOfDay(new Date(a.started_at)) === day)
        .reduce((sum, a) => sum + durationMs(a) / 3_600_000, 0);
      return { label: new Date(day).toLocaleDateString('fr-FR', { weekday: 'narrow' }), hours, today: i === 6 };
    });
  }, [live]);
  const weekHours = week.reduce((s, d) => s + d.hours, 0);
  const weekTutoring = live.filter(
    (a) => a.activity_type === 'tutoring_session' && a.ended_at && new Date(a.started_at).getTime() >= startOfDay(new Date()) - 6 * DAY_MS,
  ).length;

  const refreshFeatures = features.refresh;

  const handleStart = async (type: TrackedActivityType) => {
    if (await start(type)) {
      toast('Session démarrée.');
      refreshFeatures();
    }
  };
  const handleStop = async (activity: ActivityRecord) => {
    const stopped = await stop(activity.id);
    if (stopped) {
      toast(`Session enregistrée : ${summary(stopped)}.`);
      refreshFeatures();
    }
  };
  const handleMark = async (status: AttendanceStatus) => {
    const done = await markAttendance(status, dateKey(new Date()));
    if (done) {
      toast(status === 'present' ? 'Présence enregistrée.' : 'Absence enregistrée.');
      refreshFeatures();
    }
    return Boolean(done);
  };
  const handleCorrect = async (payload: ActivityCorrectionPayload) => {
    if (!correcting) return false;
    const done = await correct(correcting.id, payload);
    if (done) {
      toast('Correction enregistrée. L’entrée d’origine est conservée.');
      refreshFeatures();
    }
    return Boolean(done);
  };
  const handleSaveProfile = async (payload: Parameters<typeof profile.save>[0]) => {
    const ok = await profile.save(payload);
    if (ok) {
      toast('Profil enregistré et relu.');
      refreshFeatures();
    } else {
      toast('Le profil n’a pas pu être enregistré.', { error: true });
    }
    return ok;
  };

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-h">
          <div>
            <span className="eyebrow">Suivi</span>
            <h1 className="display" style={{ marginTop: '.7rem' }}>
              Vos habitudes, <Highlight>en direct</Highlight>.
            </h1>
          </div>
          <Link className="btn" href="/predict?mode=activity">
            Prédire depuis mon activité <ArrowRight className="ar" size={18} aria-hidden="true" />
          </Link>
        </div>

        {(actionError || error) && (
          <Banner tone="risk" title="Action impossible" className="err-banner-inline">
            {actionError ?? error}
          </Banner>
        )}

        <div className="dash">
          <TimerCard type="study_session" active={active('study_session')} busy={loading} onStart={handleStart} onStop={handleStop} />
          <TimerCard type="tutoring_session" active={active('tutoring_session')} busy={loading} onStart={handleStart} onStop={handleStop} />

          <AttendanceCard
            today={todayAttendance}
            attendanceRate={features.features ? features.features.Attendance : null}
            busy={loading}
            onMark={handleMark}
          />

          <Reveal as="article" className="card c7" delay={0.06}>
            <div className="card-h">
              <div>
                <h3 className="display">Études sur 7 jours</h3>
                <p>
                  {formatNumber(weekHours, 1)} h au total · {weekTutoring} séance{weekTutoring > 1 ? 's' : ''} de tutorat
                </p>
              </div>
            </div>
            <WeekBars days={week} />
          </Reveal>

          <Reveal as="article" className="card c12">
            <div className="card-h">
              <div>
                <h3 className="display">Mon profil</h3>
                <p>Attributs à faible variation. Valeurs enregistrées et relues à chaque prédiction.</p>
              </div>
            </div>
            {profile.loading ? (
              <p className="muted">Chargement de votre profil…</p>
            ) : (
              <>
                {profile.error && (
                  <Banner tone="risk" className="err-banner-inline">
                    {profile.error}
                  </Banner>
                )}
                <ProfileForm attributes={profile.attributes} saving={profile.saving} onSave={handleSaveProfile} />
              </>
            )}
          </Reveal>

          <Reveal as="article" className="card c12">
            <div className="card-h">
              <div>
                <h3 className="display">Journal d’activité</h3>
                <p>Une correction crée une nouvelle ligne : l’entrée d’origine est conservée et traçable.</p>
              </div>
            </div>
            <ActivityLog activities={activities} onCorrect={setCorrecting} />
          </Reveal>
        </div>
      </div>

      {correcting && <CorrectionModal activity={correcting} onClose={() => setCorrecting(null)} onSubmit={handleCorrect} />}
    </div>
  );
}
