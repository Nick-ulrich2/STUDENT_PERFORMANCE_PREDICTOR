import 'server-only';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage, translate, type Locale, type Vars } from '@/lib/i18n/core';

export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return localeFromAcceptLanguage((await headers()).get('accept-language'));
}

export async function getT(): Promise<{ locale: Locale; t: (key: string, vars?: Vars) => string }> {
  const locale = await getLocale();
  return { locale, t: (key, vars) => translate(locale, key, vars) };
}
