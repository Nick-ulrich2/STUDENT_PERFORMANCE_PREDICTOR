import type { ActivityRecord } from '@/types/activity';

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Consecutive days (ending today or, if nothing is logged yet today, ending
// yesterday so the streak doesn't visually break before the day is over)
// with at least one non-corrected activity log. Deliberately counts any
// tracked activity (study, tutoring, attendance), not just attendance —
// this rewards general engagement with the tracker, the same signal
// Duolingo-style streaks reward.
export function computeStreak(activities: ActivityRecord[]): number {
  const days = new Set(
    activities
      .filter((a) => a.status !== 'corrected')
      .map((a) => dateKey(new Date(a.started_at))),
  );

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
