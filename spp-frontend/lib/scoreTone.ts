export type ScoreTone = 'excellent' | 'good' | 'warning' | 'risk';

type ToneInfo = { label: string; tone: ScoreTone; className: string };

// Thresholds are shared with the mockup (80 / 65 / 50). The className maps to
// the --tone / --tone-bg custom properties defined in globals.css.
export function scoreTone(score: number): ToneInfo {
  if (score >= 80) return { label: 'Excellent', tone: 'excellent', className: 'tone-excellent' };
  if (score >= 65) return { label: 'Bon', tone: 'good', className: 'tone-good' };
  if (score >= 50) return { label: 'À renforcer', tone: 'warning', className: 'tone-warn' };
  return { label: 'Risque', tone: 'risk', className: 'tone-risk' };
}

export const TONE_VARS: Record<ScoreTone, string> = {
  excellent: 'var(--excellent)',
  good: 'var(--good)',
  warning: 'var(--warn)',
  risk: 'var(--risk)',
};
