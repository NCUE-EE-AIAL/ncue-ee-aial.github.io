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
