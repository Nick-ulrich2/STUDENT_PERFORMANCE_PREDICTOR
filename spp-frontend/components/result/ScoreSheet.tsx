'use client';

import { CountUp } from '@/components/ui/CountUp';
import { PenCircle } from '@/components/ui/PenCircle';
import { formatDate, formatNumber } from '@/lib/format';
import { scoreTone } from '@/lib/scoreTone';
import { useI18n } from '@/lib/i18n';

const RMSE = 2.04;
const TICKS: { at: number; align: 'start' | 'center' | 'end' }[] = [
  { at: 0, align: 'start' },
  { at: 50, align: 'center' },
  { at: 65, align: 'center' },
  { at: 80, align: 'center' },
  { at: 100, align: 'end' },
];

type ScoreSheetProps = { score: number; at: number; copyNumber: number | null };

// The "corrected exam paper": number counts up, the pen circles it, the tier
// stamp drops, and the scale shows the model's typical error band.
export function ScoreSheet({ score, at, copyNumber }: ScoreSheetProps) {
  const tone = scoreTone(score);
  const { t, locale } = useI18n();
  return (
    <article className={`copie paper-card ${tone.className}`} aria-label={t('Estimation de la note')}>
      <div className="head">
        <span>{t('Copie n°')} {copyNumber === null ? '—' : String(copyNumber).padStart(4, '0')}</span>
        <span>{formatDate(at, locale)}</span>
      </div>
      <p className="mono tiny muted" style={{ letterSpacing: '.1em' }}>
        {t('ESTIMATION DE VOTRE NOTE D’EXAMEN')}
      </p>
      <div className="score-spot">
        <PenCircle delay={1500} />
        <div className="num">
          <CountUp value={score} decimals={1} duration={1500} />
          <small>/100</small>
        </div>
      </div>
      <div style={{ minHeight: '3rem' }}>
        <span className="tier-stamp drop">{t(tone.label)}</span>
      </div>
      <div className="rangewrap">
        <div className="band-lbl" style={{ left: `${score}%` }}>
          {formatNumber(score, 1, locale)} ± 2
        </div>
        <div className="rangebar" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="band" style={{ left: `${Math.max(0, score - RMSE)}%`, width: `${RMSE * 2}%` }} />
        <div className="ticks" aria-hidden="true">
          {TICKS.map((tick) => (
            <span
              key={tick.at}
              style={{
                left: `${tick.at}%`,
                transform: tick.align === 'start' ? 'none' : tick.align === 'end' ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {tick.at}
            </span>
          ))}
        </div>
      </div>
      <p className="muted tiny" style={{ marginTop: '1rem' }}>
        {t('La bande noire est la marge d’erreur typique du modèle (RMSE {rmse}). Le résultat est une estimation, pas un verdict.', { rmse: formatNumber(RMSE, 2, locale) })}
      </p>
    </article>
  );
}
