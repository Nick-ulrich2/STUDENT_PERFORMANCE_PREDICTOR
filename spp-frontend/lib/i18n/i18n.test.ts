import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES, translate } from '@/lib/i18n/core';
import { en } from '@/lib/i18n/en';
import { faqs } from '@/data/faqs';
import { FEATURES, LEVELS_FR, SHORT_LABELS } from '@/lib/features';
import { NAV, PUBLIC_LINKS } from '@/components/layout/nav';
import { SITE_DESCRIPTION } from '@/lib/seo';
import { scoreTone } from '@/lib/scoreTone';

const ROOT = path.resolve(__dirname, '../..');
const SOURCE_DIRS = ['app', 'components', 'hooks', 'lib'];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === 'node_modules' ? [] : walk(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) && name !== 'en.ts' ? [full] : [];
  });
}

// Every literal passed to t('…') / t("…") / t(`…`), including both branches of
// t(cond ? 'a' : 'b').
const LIT = String.raw`(['"\x60])((?:\\.|(?!\1)[^\\])*)\1`;
const DIRECT = new RegExp(String.raw`\bt\(\s*` + LIT, 'g');
const TERNARY = new RegExp(String.raw`\bt\(\s*[^'"\x60()]*?\?\s*` + LIT + String.raw`\s*:\s*` + LIT, 'g');

function usedKeys(): Map<string, string> {
  const keys = new Map<string, string>();
  const add = (raw: string | undefined, file: string) => {
    const key = (raw ?? '').replace(/\\'/g, "'");
    if (key.trim()) keys.set(key, path.relative(ROOT, file));
  };
  for (const dir of SOURCE_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const src = readFileSync(file, 'utf8');
      for (const m of Array.from(src.matchAll(DIRECT))) add(m[2], file);
      for (const m of Array.from(src.matchAll(TERNARY))) {
        add(m[2], file);
        add(m[4], file);
      }
    }
  }
  return keys;
}

describe('i18n', () => {
  it('supports French and English', () => {
    expect(LOCALES).toEqual(['fr', 'en']);
  });

  it('finds the t() keys of the source (sanity check of the scanner)', () => {
    expect(usedKeys().size).toBeGreaterThan(300);
  });

  it('has an English entry for every t() key used in the source', () => {
    const missing = Array.from(usedKeys()).filter(([key]) => !(key in en)).map(([key, file]) => `${file}: ${key}`);
    expect(missing).toEqual([]);
  });

  it('has an English entry for every translated data constant', () => {
    const keys = [
      ...faqs.flat(),
      SITE_DESCRIPTION,
      ...FEATURES.flatMap((f) => [f.label, f.hint, f.unit ?? '']),
      ...Object.values(LEVELS_FR),
      ...Object.values(SHORT_LABELS),
      ...Object.values(NAV).flatMap((items) => items.map((i) => i.label)),
      ...PUBLIC_LINKS.map((l) => l.label),
      ...[90, 70, 55, 10].map((s) => scoreTone(s).label),
    ].filter(Boolean);
    expect(keys.filter((k) => !(k in en))).toEqual([]);
  });

  it('has no empty or French-identical English entries by accident', () => {
    const empty = Object.entries(en).filter(([, v]) => !v.trim());
    expect(empty).toEqual([]);
  });

  it('keeps the {placeholders} identical in both languages', () => {
    const names = (s: string) => Array.from(s.matchAll(/\{(\w+)\}/g)).map((m) => m[1]).sort();
    const broken = Object.entries(en).filter(([fr, e]) => names(fr).join() !== names(e).join());
    expect(broken.map(([fr]) => fr)).toEqual([]);
  });

  it('interpolates variables and falls back to the French key', () => {
    expect(translate('en', 'Bonjour, {name}.', { name: 'Ada' })).toBe('Hello, Ada.');
    expect(translate('fr', 'Bonjour, {name}.', { name: 'Ada' })).toBe('Bonjour, Ada.');
    expect(translate('en', 'clé inconnue')).toBe('clé inconnue');
  });
});
