'use client';

type Feature = { key: string; label: string; value: number };

type FeatureChartProps = {
  features: Feature[];
};

export function FeatureChart({ features }: FeatureChartProps) {
  if (!features.length) {
    return <p className="text-sm text-ink/60">Aucune donnée de coefficient disponible.</p>;
  }
  const max = Math.max(...features.map((f) => Math.abs(f.value)), 0.0001);

  return (
    <ul className="grid gap-3">
      {features.map((feature) => {
        const width = `${(Math.abs(feature.value) / max) * 100}%`;
        const positive = feature.value >= 0;
        return (
          <li key={feature.key} className="grid gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">{feature.label}</span>
              <span className="font-mono text-ink/60">
                {positive ? '+' : ''}
                {feature.value.toFixed(3)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line/60">
              <div
                className={`h-full rounded-full ${positive ? 'bg-navy' : 'bg-teal'}`}
                style={{ width }}
                aria-hidden="true"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
