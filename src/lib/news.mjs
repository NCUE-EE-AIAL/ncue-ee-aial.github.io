// Which posts the homepage shows: the last 12 months, newest first, at most three. The site rebuilds weekly
// (.github/workflows/deploy.yml), so old posts drop off by themselves and the column disappears when nothing is recent.

/**
 * @template {{ data: { date: Date } }} T
 * @param {T[]} posts
 * @param {Date} [now]
 * @param {number} [months]
 * @param {number} [max]
 * @returns {T[]}
 */
export function recentNews(posts, now = new Date(), months = 12, max = 3) {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  cutoff.setUTCHours(0, 0, 0, 0);
  return posts
    .filter((p) => p.data.date.valueOf() >= cutoff.valueOf())
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, max);
}
