import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content model. Non-developers only touch files under src/content/.
 * A missing, misspelled or unknown field makes `npm run build` fail and name the file
 * (every object is strict, so a typo such as `featurd:` is an error, not silently ignored).
 * Bilingual text fields are { en: string, zh?: string }; zh falls back to en.
 */
const bi = z.strictObject({ en: z.string(), zh: z.string().optional() });

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
  schema: z.strictObject({
    title: z.string(),
    summary: z.string(),
    icon: z.enum(['camera', 'arm', 'heart', 'shield', 'globe', 'chip']),
    order: z.number().int(),
    keywords: z.array(z.string()).default([]),
    /** Optional figure: a path under public/, e.g. /images/research/stereo.jpg. Needs imageAlt. */
    image: z.string().startsWith('/').optional(),
    imageAlt: z.string().optional(),
    /** Optional YouTube video; loads only when a visitor clicks it. */
    video: z.url().optional(),
  }).refine((r) => !r.image || !!r.imageAlt, {
    error: 'image needs imageAlt (a one-line description for screen readers)',
  }),
});

/** One YAML per paper: publications/<year>-<key>.yaml */
const publications = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/publications' }),
  schema: z.strictObject({
    title: bi,
    /** One "- name" line per author. A " - " inside a name means two lines were merged by an indentation slip. */
    authors: z.array(z.string().refine((a) => !/\s-\s/.test(a), {
      error: 'an author contains " - ": check that every "- name" line has the same indentation',
    })).min(1),
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
  schema: z.strictObject({
    title: bi,
    summary: bi,
    /** "owner/name" on GitHub. Optional for projects without a public repo. */
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
    areas: z.array(areaSlug).min(1),
    year: z.number().int().optional(),
    /** people ids (file names under people/ without .yaml); an unknown id fails the build */
    members: z.array(reference('people')).default([]),
    links: z.strictObject({
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
  schema: z.strictObject({
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
    links: z.strictObject({
      github: z.url().optional(),
      scholar: z.url().optional(),
      linkedin: z.url().optional(),
      website: z.url().optional(),
      orcid: z.string().regex(/^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, {
        error: 'orcid must look like https://orcid.org/0000-0002-1825-0097',
      }).optional(),
      /** Only for the PI or staff. Students are reached through the lab address. */
      email: z.email().optional(),
    }).default({}),
    order: z.number().int().default(100),
  }).refine((p) => !p.links.email || p.role === 'pi' || p.role === 'staff', {
    error: 'links.email is only for the PI or staff; students are contacted through the lab email',
  }),
});

/** One Markdown file per post per language: news/<YYYY-MM-DD>-<slug>/en.md, zh.md */
const news = defineCollection({
  loader: glob({ pattern: '*/{en,zh}.md', base: './src/content/news' }),
  schema: z.strictObject({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
  }),
});

/** One YAML per item or group of equipment: facilities/<id>.yaml. Category level only, no per-PC specs. */
const facilities = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/facilities' }),
  schema: z.strictObject({
    name: bi,
    qty: z.number().int().positive().optional(),
    category: z.enum(['compute', 'fpga', 'edge', 'sensor', 'robot', 'other']),
    note: bi.optional(),
    order: z.number().int().default(100),
  }),
});

export const collections = { research, publications, projects, people, news, facilities };
