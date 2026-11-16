'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALE_COOKIE, intlLocale, translate, type Locale, type Vars } from '@/lib/i18n/core';

export type TFunction = (key: string, vars?: Vars) => string;

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
  // Locale-aware formatting, bound to the current language.
  number: (n: number, decimals?: number) => string;
  date: (value: string | number | Date, options: Intl.DateTimeFormatOptions) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* cookies blocked: the choice simply lasts for this visit */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nValue>(() => {
    const tag = intlLocale(locale);
    return {
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
      number: (n, decimals = 0) =>
        new Intl.NumberFormat(tag, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n),
      date: (v, options) => new Date(v).toLocaleDateString(tag, options),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n() must be used within <I18nProvider>.');
  return ctx;
}

export function useT(): TFunction {
  return useI18n().t;
}
