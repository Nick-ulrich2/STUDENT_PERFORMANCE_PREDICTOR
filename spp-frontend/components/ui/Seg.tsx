'use client';

import type { ReactNode } from 'react';

type SegOption<T extends string> = { value: T; label: ReactNode };

type SegProps<T extends string> = {
  value: T | null;
  options: SegOption<T>[];
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
};

export function Seg<T extends string>({ value, options, onChange, label, disabled }: SegProps<T>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
