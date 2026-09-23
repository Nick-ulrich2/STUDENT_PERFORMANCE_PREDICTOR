import { scoreTone, TONE_COLORS } from '@/lib/scoreTone';

type Props = {
  score: number;
};

export function ScoreBadge({ score }: Props) {
  const { tone } = scoreTone(score);
  const colors = TONE_COLORS[tone];

  return (
    <span
      className="inline-flex min-w-[64px] items-center justify-center rounded-full px-3 py-1 text-sm font-extrabold"
      style={{ color: colors.text, backgroundColor: colors.bg }}
    >
      {score.toFixed(1)}
    </span>
  );
}
