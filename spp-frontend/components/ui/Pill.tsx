import { scoreTone } from '@/lib/scoreTone';
import { SHORT_LABELS } from '@/lib/features';

export function TierPill({ score }: { score: number }) {
  const tone = scoreTone(score);
  const cls = tone.tone === 'warning' ? 'warn' : tone.tone;
  return (
    <span className={`pill ${cls}`}>
      <i />
      {tone.label}
    </span>
  );
}

export function BelowChips({ keys }: { keys: string[] | null | undefined }) {
  if (!keys || keys.length === 0) return <span className="muted tiny">Aucune</span>;
  return (
    <>
      {keys.map((k) => (
        <span key={k} className="pill warn">
          {SHORT_LABELS[k] ?? k}
        </span>
      ))}
    </>
  );
}
