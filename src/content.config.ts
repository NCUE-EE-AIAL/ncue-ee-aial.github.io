import { defineCollection, reference, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isLocalPhoto, DOI_RE, toDay, AY_MIN, ayMax, AGENCIES, sponsorEra, GRANT_NO, PARTNER_RE } from './lib/rules.mjs';

/**
 * Content model. Non-developers only touch files under src/content/.
 * A missing, misspelled or unknown field makes `npm run build` fail and name the file
 * (every object is strict, so a typo such as `featurd:` is an error, not silently ignored).
 * Bilingual text fields are { en: string, zh?: string }; zh falls back to en.
 */
const bi = z.strictObject({ en: z.string(), zh: z.string().optional() });
/** Both languages required: every photo is described for screen readers on both sites. */
const biBoth = z.strictObject({ en: z.string().min(1), zh: z.string().min(1) });
/** A day: YYYY-MM-DD (see toDay in src/lib/rules.mjs). */
const day = z.preprocess(toDay, z.date({ error: 'use YYYY-MM-DD, for example 2026-11-05' }));
/** A month: YYYY-MM. */
const ym = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: 'use YYYY-MM, for example 2026-08' });
/** A photo beside its YAML file (path relative to the YAML, e.g. ./2026.jpg). Run `npm run photos` on it first. */
const picture = (image: SchemaContext['image']) => z.strictObject({ src: image(), alt: biBoth, caption: bi.optional() });

export const AREA_SLUGS = [
  'wavelet-signal-analysis',
  'stereo-3d-vision',
  'robotic-arm',
  'biomedical-ai',
  'biometrics-security',
  'smart-grid-energy',
  'international-programs',
] as const;
const areaSlug = z.enum(AREA_SLUGS);

/** One Markdown file per research area per language: research/<slug>/en.md, research/<slug>/zh.md */
const research = defineCollection({
  loader: glob({ pattern: '*/{en,zh}.md', base: './src/content/research' }),
  schema: ({ image }) => z.strictObject({
    title: z.string(),
    summary: z.string(),
    icon: z.enum(['camera', 'arm', 'heart', 'shield', 'globe', 'chip', 'bolt', 'wave']),
    order: z.number().int(),
    keywords: z.array(z.string()).default([]),
    /** Optional figure: a photo next to this file, e.g. ./arm.jpg (run it through `npm run photos` first). Needs imageAlt. */
    image: image().optional(),
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
    doi: z.string().regex(DOI_RE, { error: 'doi is the bare identifier, for example 10.1049/icp.2024.4141 (without https://doi.org/)' }).optional(),
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
    /** Local file under public/images/people/ (.webp, .jpg, .jpeg or .png), e.g. /images/people/brian.webp. No external images. */
    photo: z.string().refine(isLocalPhoto, {
      error: 'photo must be a local file like /images/people/name.webp (.webp, .jpg, .jpeg or .png), not a URL',
    }).optional(),
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
    /** Alumni only: where the person went after the lab, e.g. { en: "Engineer, …", zh: "…工程師" }. Only with their consent. */
    destination: bi.optional(),
    order: z.number().int().default(100),
  }).refine((p) => !p.links.email || p.role === 'pi' || p.role === 'staff', {
    error: 'links.email is only for the PI or staff; students are contacted through the lab email',
  }).refine((p) => !p.destination || p.alumni, {
    error: 'destination is for alumni: add alumni: true',
  }),
});

/** One Markdown file per post per language: news/<YYYY-MM-DD>-<slug>/en.md, zh.md */
const news = defineCollection({
  loader: glob({ pattern: '*/{en,zh}.md', base: './src/content/news' }),
  schema: z.strictObject({
    title: z.string(),
    date: day,
    /** Shown in the news list and as the page's description in search results and link previews. */
    summary: z.string({ error: 'summary is required: one sentence for the news list and search results' })
      .min(1, { error: 'summary is required: one sentence for the news list and search results' }),
  }),
});

/** One YAML per item or group of equipment: facilities/<id>.yaml. Category level only, no per-PC specs. */
const facilities = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/facilities' }),
  schema: ({ image }) => z.strictObject({
    name: bi,
    qty: z.number().int().positive().optional(),
    category: z.enum(['compute', 'fpga', 'edge', 'sensor', 'robot', 'other']),
    note: bi.optional(),
    /** Optional photo beside the YAML (no people, no screens with personal data). */
    photo: picture(image).optional(),
    order: z.number().int().default(100),
  }),
});

/**
 * One YAML per master's thesis advised: theses/<ay>-<handle id>.yaml, copied from the NDLTD record page.
 * `ay` is the ROC academic year. `dept` only when the department is not 電機工程學系. Names stay in Chinese.
 */
const theses = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/theses' }),
  schema: z.strictObject({
    student: z.strictObject({ zh: z.string(), en: z.string().optional() }),
    degree: z.enum(['master', 'phd']),
    ay: z.number().int()
      .min(AY_MIN, { error: `ay is the ROC academic year, ${AY_MIN} or later (for example 113)` })
      .max(ayMax(), { error: `ay is the ROC academic year, ${ayMax()} at most (for example 113 for 2024–25)` }),
    dept: z.string().optional(),
    title: z.strictObject({ zh: z.string(), en: z.string().optional() }),
    /** Every advisor other than 楊文然, in Chinese, without 博士. */
    coAdvisors: z.array(z.string()).default([]),
    /** The 論文永久網址 from the NDLTD record page. */
    url: z.string().regex(/^https:\/\/hdl\.handle\.net\/11296\/[a-z0-9]+$/, {
      error: 'url must look like https://hdl.handle.net/11296/abc123 (the 論文永久網址)',
    }),
  }),
});

export const SPONSORS = ['nsc', 'most', 'nstc', 'moe', 'industry', 'other'] as const;

/**
 * One YAML per funded project: grants/<start>-<slug>.yaml. No budgets. An industry (產學) project never names
 * its partner: no number, sponsorName or grb, and no company name in the title, summary or source.
 */
const grants = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/grants' }),
  schema: z.strictObject({
    title: bi,
    sponsor: z.enum(SPONSORS),
    /** Only with sponsor: other, e.g. { en: "Changhua County Government", zh: "彰化縣政府" }. */
    sponsorName: bi.optional(),
    /** NSC/MOST/NSTC grant number without the agency prefix, e.g. 112-2221-E-018-009-MY2. */
    number: z.string().optional(),
    start: ym,
    end: ym,
    role: z.enum(['pi', 'co-pi']),
    areas: z.array(areaSlug).default([]),
    summary: bi.optional(),
    /** The project's record on GRB (政府研究資訊系統), if it has one. */
    grb: z.url().optional(),
    related: z.strictObject({
      publications: z.array(reference('publications')).default([]),
      theses: z.array(reference('theses')).default([]),
    }).default({ publications: [], theses: [] }),
    /** Where the facts come from: a URL, or who supplied them and when. For an industry project: who and when, never the company. */
    source: z.string().min(1),
  })
    .refine((g) => g.end >= g.start, { error: 'end is before start' })
    .refine((g) => !AGENCIES.includes(g.sponsor) || sponsorEra(g.start).includes(g.sponsor), {
      error: 'sponsor must match the start month: nsc until 2014-03, most from 2014-03 to 2022-07, nstc from 2022-07',
    })
    .refine((g) => !AGENCIES.includes(g.sponsor) || (!!g.number && GRANT_NO.test(g.number)), {
      error: 'NSC/MOST/NSTC grants need a number like 112-2221-E-018-009-MY2 (without the agency prefix)',
    })
    .refine((g) => !g.sponsorName || g.sponsor === 'other', { error: 'sponsorName is only for sponsor: other' })
    .refine((g) => g.sponsor !== 'industry' || (!g.number && !g.sponsorName && !g.grb), {
      error: 'industry projects never name the partner: no number, sponsorName or grb',
    })
    .refine((g) => g.sponsor !== 'industry' || !PARTNER_RE.test([g.title.en, g.title.zh, g.summary?.en, g.summary?.zh, g.source].join(' ')), {
      error: 'industry projects never name the partner: take the company name out of the title, summary and source',
    }),
});

/** One folder per event: albums/<YYYY-MM>-<slug>/index.yaml, with its photos (run `npm run photos` first) beside it. */
const albums = defineCollection({
  loader: glob({ pattern: '*/index.{yaml,yml}', base: './src/content/albums', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) => z.strictObject({
    title: bi,
    date: day,
    summary: bi.optional(),
    /** Defaults to the first photo. */
    cover: image().optional(),
    photos: z.array(picture(image)).min(1).max(12, { error: 'at most 12 photos per album: they stay in the repository for good' }),
    /** people-agreed: everyone recognisable agreed to be online. no-people: nobody recognisable is in the photos. */
    consent: z.enum(['people-agreed', 'no-people'], { error: 'consent is required: people-agreed or no-people' }),
    /** Who asked, and when, e.g. "Brian Lin, 2026-11-02". */
    consentBy: z.string().optional(),
  }),
});

/** One YAML per year: group-photos/<year>.yaml, with the photo beside it. Everyone in it agreed to be online. */
const groupPhotos = defineCollection({
  loader: glob({ pattern: '*.{yaml,yml}', base: './src/content/group-photos' }),
  schema: ({ image }) => z.strictObject({
    year: z.number().int().min(AY_MIN + 1911).max(new Date().getFullYear()),
    photo: picture(image),
    /** e.g. { en: "Front row, from left: …", zh: "前排左起：…" }. */
    names: bi.optional(),
    consent: z.literal('people-agreed', { error: 'consent: people-agreed (everyone in the photo agreed to be online)' }),
  }),
});

/** One YAML per award or honour: honors/<YYYY-MM>-<slug>.yaml. Listed on People; a won paper gets a chip. */
const honors = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/honors' }),
  schema: z.strictObject({
    title: bi,
    /** The awarding body or event. */
    by: bi,
    date: day,
    recipients: z.array(reference('people')).default([]),
    /** Recipients without a people file, as written on the award. */
    recipientNames: z.array(z.string()).default([]),
    publication: reference('publications').optional(),
    url: z.url().optional(),
    source: z.string().min(1),
  }),
});

/** Questions on the Join page: faq/<audience>-<slug>.yaml, grouped by audience, lower `order` first. */
const faq = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/faq' }),
  schema: z.strictObject({
    audience: z.enum(['master', 'undergrad', 'intl', 'all']),
    q: bi,
    a: bi,
    order: z.number().int().default(100),
    /** Where the answer comes from (URL or document), so it can be checked later. */
    source: z.string().optional(),
  }),
});

export const collections = { research, publications, projects, people, news, facilities, theses, grants, albums, groupPhotos, honors, faq };
