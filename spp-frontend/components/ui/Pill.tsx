'use client';

import { scoreTone } from '@/lib/scoreTone';
import { SHORT_LABELS } from '@/lib/features';
import { useT } from '@/lib/i18n';

export function TierPill({ score }: { score: number }) {
  const t = useT();
  const tone = scoreTone(score);
  const cls = tone.tone === 'warning' ? 'warn' : tone.tone;
  return (
    <span className={`pill ${cls}`}>
      <i />
      {t(tone.label)}
    </span>
  );
}

export function BelowChips({ keys }: { keys: string[] | null | undefined }) {
  const t = useT();
  if (!keys || keys.length === 0) return <span className="muted tiny">{t('Aucune')}</span>;
  return (
    <>
      {keys.map((k) => (
        <span key={k} className="pill warn">
          {t(SHORT_LABELS[k] ?? k)}
        </span>
      ))}
    </>
  );
}
