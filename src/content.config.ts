import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content model. Non-developers only touch files under src/content/.
 * A missing or mistyped field makes `npm run build` fail and name the file.
 * Bilingual text fields are { en: string, zh?: string }; zh falls back to en.
 */
const bi = z.object({ en: z.string(), zh: z.string().optional() });

export const AREA_SLUGS = [
  'stereo-3d-vision',
  'robotic-arm',
  'biomedical-ai',
  'biometrics-security',
  'international-programs',
] as const;
const areaSlug = z.enum(AREA_SLUGS);

/** One Markdown file per research area per language: research/<slug>/en.md, research/<slug>/zh.md */
const research = defineCollection({
  loader: glob({ pattern: '*/{en,zh}.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    icon: z.enum(['camera', 'arm', 'heart', 'shield', 'globe', 'chip']),
    order: z.number().int(),
    keywords: z.array(z.string()).default([]),
  }),
});

/** One YAML per paper: publications/<year>-<key>.yaml */
const publications = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/publications' }),
  schema: z.object({
    title: bi,
    authors: z.array(z.string()).min(1),
    venue: z.string(),
    year: z.number().int().min(1990).max(2100),
    type: z.enum(['journal', 'conference', 'thesis', 'preprint', 'other']),
    doi: z.string().optional(),
    url: z.url().optional(),
    pdf: z.string().optional(),
    code: z.url().optional(),
    tags: z.array(z.string()).default([]),
    areas: z.array(areaSlug).default([]),
    featured: z.boolean().default(false),
    /** false = details not yet checked against the publisher page; shown with a "to verify" mark. */
    verified: z.boolean().default(false),
    /** Where the data came from (URL or note). Required when verified is true. */
    source: z.string().optional(),
  }).refine((p) => !p.verified || !!p.source, {
    error: 'verified: true requires a source URL',
  }),
});

/** One YAML per project: projects/<slug>.yaml. GitHub metadata is fetched at build time from `repo`. */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/projects' }),
  schema: z.object({
    title: bi,
    summary: bi,
    /** "owner/name" on GitHub. Optional for projects without a public repo. */
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
    areas: z.array(areaSlug).min(1),
    year: z.number().int().optional(),
    /** people ids (file names under people/) */
    members: z.array(z.string()).default([]),
    links: z.object({
      demo: z.url().optional(),
      video: z.url().optional(),
      paper: z.string().optional(),
    }).default({}),
    status: z.enum(['active', 'archived']).default('active'),
    featured: z.boolean().default(false),
  }),
});

/** One YAML per person: people/<id>.yaml */
const people = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/people' }),
  schema: z.object({
    name: bi,
    role: z.enum(['pi', 'phd', 'master', 'undergrad', 'intern', 'staff']),
    /** International program, if any. */
    program: z.enum(['TEEP', 'IIPP']).optional(),
    alumni: z.boolean().default(false),
    /** e.g. "2024–" or "2022–2024" */
    years: z.string().optional(),
    areas: z.array(areaSlug).default([]),
    bio: bi.optional(),
    /** Path under public/, e.g. /images/people/brian.jpg */
    photo: z.string().optional(),
    links: z.object({
      github: z.url().optional(),
      scholar: z.url().optional(),
      linkedin: z.url().optional(),
      website: z.url().optional(),
      email: z.email().optional(),
    }).default({}),
    order: z.number().int().default(100),
  }),
});

/** One Markdown file per post per language: news/<YYYY-MM-DD>-<slug>/en.md, zh.md */
const news = defineCollection({
  loader: glob({ pattern: '*/{en,zh}.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
  }),
});

export const collections = { research, publications, projects, people, news };
