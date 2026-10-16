import { ui, site, DEFAULT_LOCALE, LOCALES, type Locale, type UiKey } from './ui';
export type { Locale, UiKey } from './ui';
export { LOCALES, DEFAULT_LOCALE } from './ui';

export type Bi = { en: string; zh?: string };

export function isLocale(x: unknown): x is Locale {
  return typeof x === 'string' && (LOCALES as readonly string[]).includes(x);
}

/** Resolve Astro.currentLocale (string | undefined) to a Locale. */
export function asLocale(x: string | undefined): Locale {
  return isLocale(x) ? x : DEFAULT_LOCALE;
}

/** Pick a bilingual field; zh falls back to en. */
export function pick(field: Bi | string | undefined, lang: Locale): string {
  if (field === undefined) return '';
  if (typeof field === 'string') return field;
  return (lang === 'zh' && field.zh) || field.en;
}

export function t(key: UiKey, lang: Locale): string {
  return ui[key][lang];
}

export function s<K extends keyof typeof site>(key: K, lang: Locale): string {
  const v = site[key] as unknown;
  return typeof v === 'string' ? v : pick(v as Bi, lang);
}

/** Build a site-relative path for `lang`. `path` is locale-less, e.g. "/people/". */
export function localePath(path: string, lang: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return lang === DEFAULT_LOCALE ? clean : `/${lang}${clean === '/' ? '/' : clean}`;
}

/** Strip a locale prefix from a pathname, returning the locale-less path. */
export function stripLocale(pathname: string): { lang: Locale; path: string } {
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue;
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      const rest = pathname.slice(l.length + 1) || '/';
      return { lang: l, path: rest };
    }
  }
  return { lang: DEFAULT_LOCALE, path: pathname || '/' };
}

export function otherLocale(lang: Locale): Locale {
  return lang === 'en' ? 'zh' : 'en';
}

export const htmlLang: Record<Locale, string> = { en: 'en', zh: 'zh-Hant-TW' };

export function formatDate(d: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-TW' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(d);
}
