'use client';

import { Bar } from '@/components/ui/Bar';
import { BelowChips } from '@/components/ui/Pill';
import { FEATURE_BY_KEY, LEVELS_FR, labelOf, type FeatureKey } from '@/lib/features';
import { formatNumber } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import type { PredictionOutput, ResourceLevel, StudentInput } from '@/types/prediction';

export function Importance({ output, vars }: { output: PredictionOutput; vars: StudentInput }) {
  const { t, locale } = useI18n();
  const entries = Object.entries(output.top_features).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const max = Math.max(...entries.map(([, c]) => Math.abs(c)), 0.0001);

  return (
    <article className="card">
      <div className="card-h">
        <div>
          <h3 className="display">{t('Ce qui pèse le plus')}</h3>
          <p>{t('Coefficients du modèle, triés par importance absolue. En orange, vos variables sous le seuil.')}</p>
        </div>
      </div>
      <div className="imp">
        {entries.map(([key, coef]) => {
          const def = FEATURE_BY_KEY[key as FeatureKey];
          const under = output.below_threshold.includes(key);
          const raw = vars[key as FeatureKey];
          const shown = def?.categorical ? t(LEVELS_FR[raw as ResourceLevel]) : raw;
          return (
            <div key={key} className={`imp-r${under ? ' under' : ''}`}>
              <span className="nm">
                {t(labelOf(key))}
                <span className="muted tiny">({shown})</span>
              </span>
              <Bar pct={(Math.abs(coef) / max) * 100} warn={under} label={`${t(labelOf(key))} : ${t('poids')} ${formatNumber(coef, 2, locale)}`} />
              <b>
                {coef >= 0 ? '+' : '−'}
                {formatNumber(Math.abs(coef), 2, locale)}
              </b>
            </div>
          );
        })}
      </div>
      <div className="row" style={{ marginTop: '1.2rem' }}>
        <span className="lbl">{t('Sous les seuils :')}</span>
        <BelowChips keys={output.below_threshold} />
      </div>
    </article>
  );
}
