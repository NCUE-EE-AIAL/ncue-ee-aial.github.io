// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
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
  // Photos (src/content/**) become AVIF/WebP/JPEG at build time; the cache keeps rebuilds fast.
  image: {
    service: { entrypoint: 'astro/assets/services/sharp', config: { avif: { effort: 3 }, jpeg: { mozjpeg: true } } },
  },
  cacheDir: './.cache/astro',
  // Minify the HTML. Astro keeps the spaces that inline text needs, so mixed zh/en text renders unchanged.
  compressHTML: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
    // No route-level fallback: every page exists in both languages (thin files under src/pages/zh/),
    // and missing zh fields fall back to en inside the components (pick() in src/i18n/utils.ts).
  },
  // Inter is self-hosted (SIL OFL 1.1, src/assets/fonts/OFL.txt): the Latin variable subset from
  // @fontsource-variable/inter 5.3.0, so the site requests nothing from other origins.
  // Traditional Chinese families come before system-ui, so Han characters keep their Taiwanese forms.
  fonts: [{
    provider: fontProviders.local(),
    name: 'Inter',
    cssVariable: '--font-inter',
    display: 'swap',
    fallbacks: ['Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
    options: {
      variants: [{
        src: ['./src/assets/fonts/inter-latin-wght.woff2'],
        weight: '100 900',
        style: 'normal',
        unicodeRange: ['U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC', 'U+0304', 'U+0308', 'U+0329',
          'U+2000-206F', 'U+20AC', 'U+2122', 'U+2191', 'U+2193', 'U+2212', 'U+2215', 'U+FEFF', 'U+FFFD'],
      }],
    },
  }],
  integrations: [
    stripHtmlComments,
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', zh: 'zh-Hant-TW' } },
    }),
  ],
});
