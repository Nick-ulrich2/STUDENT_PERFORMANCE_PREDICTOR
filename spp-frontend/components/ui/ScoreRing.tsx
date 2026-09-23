'use client';

import { useEffect, useState } from 'react';
import { TONE_COLORS, type ScoreTone } from '@/lib/scoreTone';

type Props = {
  score: number;
  label: string;
  tone: ScoreTone;
  size?: number;
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreRing({ score, label, tone, size = 168 }: Props) {
  // Animate from 0 on mount instead of snapping straight to the final value —
  // the fill sweeping in is the one piece of motion that makes the number feel
  // computed rather than just printed.
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDisplay(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const clamped = Math.max(0, Math.min(100, display));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const color = TONE_COLORS[tone].text;

  return (
    <div
      role="img"
      aria-label={`Score prédit : ${score.toFixed(1)} sur 100, ${label}`}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 -z-10 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${color}26 0%, transparent 70%)` }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 120 120" width={size} height={size} className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="var(--line)"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.34,1.4,.64,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-4xl text-navy">
          {score.toFixed(1)}
          <span className="text-base text-ink/40">/100</span>
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color }}>
          {label}
        </p>
      </div>
    </div>
  );
}
