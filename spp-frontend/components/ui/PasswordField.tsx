'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
  required?: boolean;
};

export function PasswordField({ id, value, onChange, autoComplete, minLength, required }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock size={16} strokeWidth={2} className="form-field-icon" aria-hidden="true" />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        className="form-input form-input-icon pr-11"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-navy"
      >
        {visible ? (
          <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Eye size={16} strokeWidth={2} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
