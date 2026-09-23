export type ScoreTone = 'excellent' | 'good' | 'warning' | 'risk';

export const TONE_COLORS: Record<ScoreTone, { text: string; bg: string }> = {
  excellent: { text: '#2d7770', bg: '#d7eee4' },
  good: { text: '#123d59', bg: '#dff0f4' },
  warning: { text: '#b45309', bg: '#fef3c7' },
  risk: { text: '#b91c1c', bg: '#fee2e2' },
};

export function scoreTone(score: number): { label: string; tone: ScoreTone } {
  if (score >= 80) return { label: 'Excellent', tone: 'excellent' };
  if (score >= 65) return { label: 'Bon', tone: 'good' };
  if (score >= 50) return { label: 'À renforcer', tone: 'warning' };
  return { label: 'Risque', tone: 'risk' };
}
