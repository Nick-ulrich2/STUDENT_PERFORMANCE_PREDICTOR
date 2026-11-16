'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/core';

const OPTIONS: { value: Locale; short: string; name: string }[] = [
  { value: 'fr', short: 'FR', name: 'Français' },
  { value: 'en', short: 'EN', name: 'English' },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  return (
    <div className="lang" role="group" aria-label={t('Langue')}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.value}
          title={o.name}
          aria-label={o.name}
          aria-pressed={locale === o.value}
          onClick={() => {
            setLocale(o.value);
            // Re-render the server parts (page title, metadata) in the new language.
            router.refresh();
          }}
        >
          {o.short}
        </button>
      ))}
    </div>
  );
}
