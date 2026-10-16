// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en-US', zh: 'zh-TW' } },
    }),
  ],
});
