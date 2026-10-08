import { FEATURES, isBelowThreshold } from '@/lib/features';
export function ThresholdList({ values }: { values: object }) {
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
            <span style={{ fontSize: '.9rem' }}>{f.label}</span>
            <span className={`pill${value === null ? '' : low ? ' warn' : ' excellent'}`}>
              {value === null ? 'seuil' : low ? 'sous' : 'ok'} · {f.threshold}
              {f.unit === '%' ? ' %' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
