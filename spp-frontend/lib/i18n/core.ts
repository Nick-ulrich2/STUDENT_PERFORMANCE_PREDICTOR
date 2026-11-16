// Server-safe i18n core. The French text IS the key: t('Se connecter') returns
// the French string unchanged, and the English dictionary maps it to English.
// A missing English entry falls back to French (and lib/i18n.test.ts fails the
// build pipeline, so a missing entry cannot ship unnoticed).
import { en } from '@/lib/i18n/en';

export type Locale = 'fr' | 'en';

export const LOCALES: Locale[] = ['fr', 'en'];
export const DEFAULT_LOCALE: Locale = 'fr';
export const LOCALE_COOKIE = 'spp-lang';

export function isLocale(value: unknown): value is Locale {
  return value === 'fr' || value === 'en';
}

// First visit (no cookie yet): follow the browser's Accept-Language header.
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  const first = (header ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('en') ? 'en' : DEFAULT_LOCALE;
}

export function intlLocale(locale: Locale): string {
  return locale === 'en' ? 'en-GB' : 'fr-FR';
}

export type Vars = Record<string, string | number>;

export function translate(locale: Locale, key: string, vars?: Vars): string {
  const template = locale === 'en' ? (en[key] ?? key) : key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}
