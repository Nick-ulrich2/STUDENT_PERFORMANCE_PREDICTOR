import { intlLocale, translate, type Locale } from '@/lib/i18n/core';

export function formatNumber(n: number, decimals = 0, locale: Locale = 'fr'): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const DAY_MS = 86_400_000;

export function relativeDay(iso: string | number | Date, locale: Locale = 'fr'): string {
  const date = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
  if (diff === 0) return translate(locale, 'Aujourd’hui');
  if (diff === 1) return translate(locale, 'Hier');
  return date.toLocaleDateString(intlLocale(locale), { weekday: 'long', day: 'numeric', month: 'short' });
}

export function formatDate(iso: string | number | Date, locale: Locale = 'fr'): string {
  return new Date(iso).toLocaleDateString(intlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(iso: string | number | Date, locale: Locale = 'fr'): string {
  return new Date(iso).toLocaleTimeString(intlLocale(locale), { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(ms: number, locale: Locale = 'fr'): string {
  const minutes = Math.round(ms / 60_000);
  const hour = translate(locale, 'h');
  if (minutes >= 60) return `${Math.floor(minutes / 60)} ${hour} ${String(minutes % 60).padStart(2, '0')}`;
  return `${minutes} min`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

export function firstNameFromEmail(email: string, locale: Locale = 'fr'): string {
  const local = email.split('@')[0] ?? '';
  const token = local.split(/[._\-+\d]/)[0] ?? '';
  if (!token) return translate(locale, 'vous');
  return token.charAt(0).toUpperCase() + token.slice(1);
}
