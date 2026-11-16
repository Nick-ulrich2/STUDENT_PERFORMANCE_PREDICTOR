'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useT } from '@/lib/i18n';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
  extra?: ReactNode;
};

export function PasswordField({ id, label, value, onChange, autoComplete, error, extra }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const t = useT();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw">
        <input
          id={id}
          className={`inp${error ? ' err' : ''}`}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      {extra}
      <div className="err-msg" aria-live="polite">
        {error && (
          <>
            <AlertTriangle size={14} aria-hidden="true" /> {error}
          </>
        )}
      </div>
    </div>
  );
}
