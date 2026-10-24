// RSS 2.0 for the news posts, built by hand (no extra dependency). Plain function over plain data, so tests can call it.

/** @param {string} s */
const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * @param {{ title: string, description: string, home: string, self: string, language: string,
 *   items: { title: string, summary: string, url: string, date: Date }[] }} o
 */
export function rssFeed(o) {
  const items = o.items.map((i) => [
    '<item>',
    `<title>${xml(i.title)}</title>`,
    `<link>${xml(i.url)}</link>`,
    `<guid isPermaLink="true">${xml(i.url)}</guid>`,
    `<pubDate>${i.date.toUTCString()}</pubDate>`,
    `<description>${xml(i.summary)}</description>`,
    '</item>',
  ].join(''));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
    `<title>${xml(o.title)}</title>`,
    `<link>${xml(o.home)}</link>`,
    `<description>${xml(o.description)}</description>`,
    `<language>${xml(o.language)}</language>`,
    `<atom:link href="${xml(o.self)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    '</channel></rss>',
  ].join('\n');
}
