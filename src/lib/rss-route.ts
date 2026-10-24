import { rssFeed } from './rss.mjs';
import { getNews } from './data';
import { slugOf } from './format';
import { htmlLang, localePath, t, type Locale } from '../i18n/utils';
import { site } from '../i18n/ui';

/** The /rss.xml and /zh/rss.xml endpoints: every news post in that language, newest first. */
export async function newsFeed(lang: Locale, base: URL): Promise<Response> {
  const abs = (path: string) => new URL(localePath(path, lang), base).href;
  const posts = await getNews(lang);
  const body = rssFeed({
    title: `${site.name[lang]} · ${t('news.title', lang)}`,
    description: site.description[lang],
    home: abs('/'),
    self: abs('/rss.xml'),
    language: htmlLang[lang],
    items: posts.map((p) => ({ title: p.data.title, summary: p.data.summary, url: abs(`/news/${slugOf(p.id)}/`), date: p.data.date })),
  });
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
