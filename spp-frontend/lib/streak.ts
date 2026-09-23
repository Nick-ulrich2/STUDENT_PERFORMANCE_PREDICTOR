import type { ActivityRecord } from '@/types/activity';

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function activeDaySet(activities: ActivityRecord[]): Set<string> {
  return new Set(
    activities
      .filter((a) => a.status !== 'corrected')
      .map((a) => dateKey(new Date(a.started_at))),
  );
}

function streakFromDays(days: Set<string>): number {
  const cursor = new Date();
  if (!days.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Consecutive days (ending today or, if nothing is logged yet today, ending
// yesterday so the streak doesn't visually break before the day is over)
// with at least one non-corrected activity log. Deliberately counts any
// tracked activity (study, tutoring, attendance), not just attendance —
// this rewards general engagement with the tracker, the same signal
// Duolingo-style streaks reward.
export function computeStreak(activities: ActivityRecord[]): number {
  return streakFromDays(activeDaySet(activities));
}

// Same idea, scoped to a single activity type — Habitica-style per-habit
// streaks rather than one global number, so "study session" and "attendance"
// can each carry their own momentum.
export function computeStreakForType(activities: ActivityRecord[], type: string): number {
  return streakFromDays(activeDaySet(activities.filter((a) => a.activity_type === type)));
}

export function hasActivityTodayOfType(activities: ActivityRecord[], type: string): boolean {
  const today = dateKey(new Date());
  return activities.some(
    (a) => a.activity_type === type && a.status !== 'corrected' && dateKey(new Date(a.started_at)) === today,
  );
}

export type HeatmapDay = { key: string; date: Date; active: boolean };

// Builds a GitHub-contributions-style grid: `weeks` columns of 7 days each,
// oldest first, ending today. Each day is just "was anything logged" — kept
// binary rather than intensity-graded to stay simple and calm rather than
// gamified.
export function buildHeatmap(activities: ActivityRecord[], weeks = 10): HeatmapDay[] {
  const days = activeDaySet(activities);
  const totalDays = weeks * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result: HeatmapDay[] = [];
  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = dateKey(date);
    result.push({ key, date, active: days.has(key) });
  }
  return result;
}
