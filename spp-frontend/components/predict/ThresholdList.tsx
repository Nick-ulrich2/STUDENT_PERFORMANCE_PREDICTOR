'use client';

import { FEATURES, isBelowThreshold } from '@/lib/features';
import { useT } from '@/lib/i18n';

export function ThresholdList({ values }: { values: object }) {
  const t = useT();
  const lookup = values as Record<string, unknown>;
  return (
    <div>
      {FEATURES.filter((f) => f.threshold !== undefined).map((f) => {
        const raw = lookup[f.key];
        const value = typeof raw === 'number' ? raw : null;
        const low = isBelowThreshold(f, value);
        return (
          <div
            key={f.key}
            className="row"
            style={{ justifyContent: 'space-between', padding: '.45rem 0', borderBottom: '1px dashed var(--line-2)' }}
          >
            <span style={{ fontSize: '.9rem' }}>{t(f.label)}</span>
            <span className={`pill${value === null ? '' : low ? ' warn' : ' excellent'}`}>
              {value === null ? t('seuil') : low ? t('sous') : t('ok')} · {f.threshold}
              {f.unit === '%' ? ' %' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
