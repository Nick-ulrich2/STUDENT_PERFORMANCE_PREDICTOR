import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  label: string;
  done: boolean;
};

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// A Streaks-style tile: one icon, one ring, done or not — no number to read,
// the state is legible at a glance across a whole row of habits.
export function IconRingTile({ icon: Icon, label, done }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative inline-flex h-16 w-16 items-center justify-center">
        <svg viewBox="0 0 64 64" width={64} height={64} className="-rotate-90">
          <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="5" />
          {done && (
            <circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke="var(--teal)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={0}
            />
          )}
        </svg>
        <Icon
          size={20}
          strokeWidth={2}
          className={`absolute ${done ? 'text-teal' : 'text-ink/35'}`}
        />
      </div>
      <span className={`text-xs font-semibold ${done ? 'text-navy' : 'text-ink/50'}`}>{label}</span>
    </div>
  );
}
