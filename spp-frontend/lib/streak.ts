import type { ActivityRecord } from '@/types/activity';
import { startOfDay } from '@/lib/format';

const DAY_MS = 86_400_000;

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// A corrected row is superseded by its replacement, so it never counts.
function live(activities: ActivityRecord[]): ActivityRecord[] {
  return activities.filter((a) => a.status !== 'corrected');
}

function daySet(activities: ActivityRecord[]): Set<string> {
  return new Set(activities.map((a) => dateKey(new Date(a.started_at))));
}

// Consecutive days ending today — or yesterday when nothing is logged yet
// today, so a streak does not visually break before the day is over.
function streakFromDays(days: Set<string>): number {
  const cursor = new Date();
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeStreak(
  activities: ActivityRecord[],
  predicate: (a: ActivityRecord) => boolean = () => true,
): number {
  return streakFromDays(daySet(live(activities).filter(predicate)));
}

export type HeatmapDay = { key: string; date: Date; level: 0 | 1 | 2 | 3 | 4 };

// 7 rows per column, oldest first, ending today. The level is the number of
// logged activities that day, capped at 4.
export function buildHeatmap(activities: ActivityRecord[], weeks = 18): HeatmapDay[] {
  const counts = new Map<string, number>();
  for (const a of live(activities)) {
    const key = dateKey(new Date(a.started_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const today = startOfDay(new Date());
  const days: HeatmapDay[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i -= 1) {
    const date = new Date(today - i * DAY_MS);
    const n = counts.get(dateKey(date)) ?? 0;
    days.push({ key: dateKey(date), date, level: Math.min(4, n) as HeatmapDay['level'] });
  }
  return days;
}

export function durationMs(a: ActivityRecord): number {
  if (!a.ended_at) return 0;
  return new Date(a.ended_at).getTime() - new Date(a.started_at).getTime();
}
