// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Strip HTML comments from the built pages: editors leave `<!-- TODO -->` notes in Markdown,
 * and those must not reach the public HTML. (Runs after the build, so it works with any Markdown processor.)
 */
/** @type {import('astro').AstroIntegration} */
const stripHtmlComments = {
  name: 'strip-html-comments',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      /** @param {string} folder */
      const walk = async (folder) => {
        for (const entry of await readdir(folder, { withFileTypes: true })) {
          const path = join(folder, entry.name);
          if (entry.isDirectory()) await walk(path);
          else if (entry.name.endsWith('.html')) {
            const html = await readFile(path, 'utf8');
            const stripped = html.replace(/<!--[\s\S]*?-->/g, '');
            if (stripped !== html) await writeFile(path, stripped);
          }
        }
      };
      await walk(fileURLToPath(dir));
    },
  },
};

export default defineConfig({
  site: 'https://ncue-ee-aial.github.io',
  // Keep whitespace between inline mixed zh/en text intact.
  compressHTML: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
    // No route-level fallback: every page exists in both languages (thin files under src/pages/zh/),
    // and missing zh fields fall back to en inside the components (pick() in src/i18n/utils.ts).
  },
  integrations: [
    stripHtmlComments,
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en-US', zh: 'zh-TW' } },
    }),
  ],
});
