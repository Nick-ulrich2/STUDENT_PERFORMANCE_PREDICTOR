'use client';

import { AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n';

type EmailFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function EmailField({ id, value, onChange, error }: EmailFieldProps) {
  const t = useT();
  return (
    <div className="field">
      <label htmlFor={id}>{t('Adresse e-mail')}</label>
      <input
        id={id}
        className={`inp${error ? ' err' : ''}`}
        type="email"
        autoComplete="email"
        placeholder={t('vous@exemple.cm')}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
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

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
