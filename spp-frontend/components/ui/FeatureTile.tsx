'use client';

import { Bar } from '@/components/ui/Bar';
import { useI18n } from '@/lib/i18n';
import { FEATURE_BY_KEY, LEVELS, LEVELS_FR, isBelowThreshold, type FeatureKey } from '@/lib/features';
import { formatNumber } from '@/lib/format';
import type { ResourceLevel } from '@/types/prediction';

type FeatureTileProps = { featureKey: FeatureKey; value: number | ResourceLevel | null | undefined };

export function FeatureTile({ featureKey, value }: FeatureTileProps) {
  const { t, locale } = useI18n();
  const def = FEATURE_BY_KEY[featureKey];
  const Icon = def.icon;
  const missing = value === null || value === undefined;
  const numeric = typeof value === 'number' ? value : undefined;
  const low = isBelowThreshold(def, numeric);

  let display = '—';
  let pct = 0;
  if (!missing) {
    if (def.categorical) {
      display = t(LEVELS_FR[value as ResourceLevel]);
      pct = ((LEVELS.indexOf(value as ResourceLevel) + 1) / 3) * 100;
    } else {
      display = formatNumber(numeric!, featureKey === 'Hours_Studied' ? 1 : 0, locale);
      pct = (numeric! / (def.max ?? 100)) * 100;
    }
  }
  const thresholdPct = def.threshold !== undefined && def.max ? (def.threshold / def.max) * 100 : undefined;

  return (
    <div className={`tile${low ? ' low' : ''}`}>
      {low && <span className="flag">{t('sous le seuil')}</span>}
      <div className="ic">
        <Icon size={26} strokeWidth={1.8} aria-hidden="true" />
        <span>{t(def.label)}</span>
      </div>
      <b>
        {display}
        {!missing && def.unit && <small>{t(def.unit)}</small>}
      </b>
      <Bar pct={pct} threshold={thresholdPct} warn={low} label={`${t(def.label)} : ${display}`} />
    </div>
  );
}
