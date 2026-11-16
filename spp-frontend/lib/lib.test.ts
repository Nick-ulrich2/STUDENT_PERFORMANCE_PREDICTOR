import { describe, expect, it, vi, afterEach } from 'vitest';
import { firstNameFromEmail, formatClock, formatDuration, formatNumber, relativeDay } from '@/lib/format';
import { previewScore } from '@/lib/model';
import { priorityAction } from '@/lib/priority';
import { scoreTone } from '@/lib/scoreTone';
import { buildHeatmap, computeStreak, dateKey } from '@/lib/streak';
import { newestFirst } from '@/lib/predictions';
import { isBelowThreshold, FEATURE_BY_KEY } from '@/lib/features';
import type { ActivityRecord, AggregatedFeatures } from '@/types/activity';
import type { PredictionRecord } from '@/types/prediction';
import { translate } from '@/lib/i18n/core';

const T = (key: string, vars?: Record<string, string | number>) => translate('fr', key, vars);

afterEach(() => vi.useRealTimers());

const NOW = new Date(2026, 9, 8, 12, 0, 0);

function activity(daysAgo: number, overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  const start = new Date(NOW);
  start.setDate(start.getDate() - daysAgo);
  return {
    id: Math.floor(Math.random() * 1e9),
    activity_type: 'study_session',
    status: 'completed',
    started_at: start.toISOString(),
    ended_at: new Date(start.getTime() + 3_600_000).toISOString(),
    corrected_from: null,
    note: null,
    ...overrides,
  };
}

const features = (over: Partial<AggregatedFeatures> = {}): AggregatedFeatures => ({
  Attendance: 90,
  Hours_Studied: 20,
  Previous_Scores: 75,
  Tutoring_Sessions: 3,
  Access_to_Resources: 'Medium',
  Parental_Involvement: 'Medium',
  window_days: 7,
  days_logged: 5,
  ...over,
});

describe('scoreTone', () => {
  it.each([
    [80, 'excellent'],
    [79.9, 'good'],
    [65, 'good'],
    [64.9, 'warning'],
    [50, 'warning'],
    [49.9, 'risk'],
  ])('%s -> %s', (score, tone) => {
    expect(scoreTone(score).tone).toBe(tone);
  });
});

describe('previewScore (landing demo)', () => {
  it('reproduces the figure shown in the mockup', () => {
    const score = previewScore({
      Attendance: 80,
      Hours_Studied: 18,
      Previous_Scores: 70,
      Tutoring_Sessions: 1,
      Access_to_Resources: 'Medium',
      Parental_Involvement: 'Medium',
    });
    expect(score).toBe(66);
  });

  it('is clamped to 0-100', () => {
    const base = { Previous_Scores: 100, Tutoring_Sessions: 8, Access_to_Resources: 'High', Parental_Involvement: 'High' } as const;
    expect(previewScore({ ...base, Attendance: 100, Hours_Studied: 45 })).toBeLessThanOrEqual(100);
    expect(previewScore({ Attendance: 0, Hours_Studied: 0, Previous_Scores: 0, Tutoring_Sessions: 0, Access_to_Resources: 'Low', Parental_Involvement: 'Low' })).toBeGreaterThanOrEqual(0);
  });
});

describe('priorityAction', () => {
  it('asks to complete the tracking when features are unavailable', () => {
    expect(priorityAction(null, T, 'fr').href).toBe('/tracking');
  });

  it('says everything is fine when no threshold is missed', () => {
    expect(priorityAction(features(), T, 'fr').title).toMatch(/au vert/);
  });

  it('targets the variable furthest below its threshold', () => {
    const action = priorityAction(features({ Attendance: 30, Tutoring_Sessions: 1 }), T, 'fr');
    expect(action.title).toMatch(/présent/i);
  });

  it('suggests tutoring when it is the only gap', () => {
    expect(priorityAction(features({ Tutoring_Sessions: 0 }), T, 'fr').cta).toMatch(/séance/i);
  });
});

describe('streaks and heatmap', () => {
  it('counts consecutive days ending today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(computeStreak([activity(0), activity(1), activity(2), activity(4)])).toBe(3);
  });

  it('keeps a streak alive until the end of today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(computeStreak([activity(1), activity(2)])).toBe(2);
  });

  it('ignores corrected rows', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(computeStreak([activity(0, { status: 'corrected' })])).toBe(0);
  });

  it('filters by predicate', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const rows = [activity(0), activity(0, { activity_type: 'attendance', status: 'present' })];
    expect(computeStreak(rows, (a) => a.activity_type === 'attendance' && a.status === 'present')).toBe(1);
    expect(computeStreak(rows, (a) => a.activity_type === 'tutoring_session')).toBe(0);
  });

  it('builds 7 rows per week, newest last, capped at level 4', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const many = Array.from({ length: 6 }, () => activity(0));
    const grid = buildHeatmap(many, 18);
    expect(grid).toHaveLength(126);
    expect(grid.at(-1)?.key).toBe(dateKey(NOW));
    expect(grid.at(-1)?.level).toBe(4);
    expect(grid[0].level).toBe(0);
  });
});

describe('format helpers', () => {
  it('uses French decimals', () => {
    expect(formatNumber(66.04, 1)).toBe('66,0');
  });

  it('formats clocks beyond 99 hours', () => {
    expect(formatClock(372 * 3_600_000 + 44 * 60_000 + 44_000)).toBe('372:44:44');
  });

  it('formats durations', () => {
    expect(formatDuration(95 * 60_000)).toBe('1 h 35');
    expect(formatDuration(45 * 60_000)).toBe('45 min');
  });

  it('derives a first name from an e-mail', () => {
    expect(firstNameFromEmail('amina.nkou@exemple.cm')).toBe('Amina');
    expect(firstNameFromEmail('audit-deep-2026@x.io')).toBe('Audit');
  });

  it('labels relative days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(relativeDay(NOW)).toBe('Aujourd’hui');
    expect(relativeDay(new Date(2026, 9, 7, 9))).toBe('Hier');
  });
});

describe('predictions and thresholds', () => {
  it('sorts newest first without mutating the input', () => {
    const rows = [
      { id: 1, created_at: '2026-10-01T10:00:00Z' },
      { id: 2, created_at: '2026-10-03T10:00:00Z' },
    ] as PredictionRecord[];
    expect(newestFirst(rows).map((r) => r.id)).toEqual([2, 1]);
    expect(rows[0].id).toBe(1);
  });

  it('mirrors the backend thresholds', () => {
    expect(isBelowThreshold(FEATURE_BY_KEY.Attendance, 69)).toBe(true);
    expect(isBelowThreshold(FEATURE_BY_KEY.Attendance, 70)).toBe(false);
    expect(isBelowThreshold(FEATURE_BY_KEY.Tutoring_Sessions, 1)).toBe(true);
    expect(isBelowThreshold(FEATURE_BY_KEY.Access_to_Resources, 0)).toBe(false);
  });
});
