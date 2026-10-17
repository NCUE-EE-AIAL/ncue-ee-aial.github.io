/** Content rules in plain JS, so the schema (src/content.config.ts) and node:test can both import them. */

/** A people photo must be one local file straight under /images/people/ (no external images, no subfolders, no query). */
export function isLocalPhoto(path) {
  return typeof path === 'string' && /^\/images\/people\/[\w.-]+\.(?:webp|jpe?g|png|avif)$/i.test(path) && !path.includes('..');
}

/** Thesis academic years (ROC): from 95 up to next year's, so a typo such as 1140 or 14 fails the build but the new year needs no edit. */
export const AY_MIN = 95;
export function ayMax(now = new Date()) {
  return now.getFullYear() - 1910 + 1;
}

/** NSC (國科會) became MOST (科技部) on 2014-03-03, and MOST became NSTC (國科會) on 2022-07-27. */
export const AGENCIES = ['nsc', 'most', 'nstc'];

/** The agency name(s) right for a grant that starts in month `ym` (YYYY-MM); the two renaming months accept both. */
export function sponsorEra(ym) {
  if (ym < '2014-03') return ['nsc'];
  if (ym === '2014-03') return ['nsc', 'most'];
  if (ym < '2022-07') return ['most'];
  if (ym === '2022-07') return ['most', 'nstc'];
  return ['nstc'];
}

/** An NSC/MOST/NSTC grant number without the agency prefix, e.g. 112-2221-E-018-009-MY2 or 108-2622-E-018-002-CC3. */
export const GRANT_NO = /^\d{2,3}-\d{4}-[A-Z]-\d{3}-\d{3}(?:-[A-Z0-9]+)*$/;

/** Company-name endings: an industry project never names its partner (CONTRIBUTING §5). */
export const PARTNER_RE = /(?:\bCo\.|\bLtd\b|\bInc\.|\bCorp\b|\bCorporation\b|\bGmbH\b|股份有限公司|有限公司|公司|企業|集團)/;

/** The current month as YYYY-MM (UTC). */
export function ymNow(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

/** A grant is ongoing through its last month. */
export function isOngoing(end, now = new Date()) {
  return end >= ymNow(now);
}
