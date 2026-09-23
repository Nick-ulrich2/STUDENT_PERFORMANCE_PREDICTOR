import type { HeatmapDay } from '@/lib/streak';

type Props = {
  days: HeatmapDay[];
};

function formatTitle(day: HeatmapDay): string {
  const label = day.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return day.active ? `${label} — activité enregistrée` : `${label} — aucune activité`;
}

export function ActivityHeatmap({ days }: Props) {
  return (
    <div>
      <div
        className="grid gap-1"
        style={{ gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column' }}
        role="img"
        aria-label={`Activité des ${days.length} derniers jours : ${days.filter((d) => d.active).length} jours actifs`}
      >
        {days.map((day) => (
          <span
            key={day.key}
            title={formatTitle(day)}
            className={`h-3 w-3 rounded-[3px] ${day.active ? 'bg-teal' : 'bg-line/70'}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-ink/45">
        Moins
        <span className="h-3 w-3 rounded-[3px] bg-line/70" />
        <span className="h-3 w-3 rounded-[3px] bg-teal" />
        Plus
      </div>
    </div>
  );
}
