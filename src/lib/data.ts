/**
 * Content access for the page components. getCollection() order is not guaranteed,
 * so every list is sorted here, once.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/utils';
import { slugOf, pickLocalized } from './format';

export type Publication = CollectionEntry<'publications'>;
export type Person = CollectionEntry<'people'>;
export type Project = CollectionEntry<'projects'>;
export type Area = CollectionEntry<'research'>;
export type NewsPost = CollectionEntry<'news'>;
export type Facility = CollectionEntry<'facilities'>;
export type Thesis = CollectionEntry<'theses'>;
export type Grant = CollectionEntry<'grants'>;
export type Album = CollectionEntry<'albums'>;
export type GroupPhoto = CollectionEntry<'groupPhotos'>;
export type Testimonial = CollectionEntry<'testimonials'>;
export type Honor = CollectionEntry<'honors'>;
export type Faq = CollectionEntry<'faq'>;

const byEn = (a: { en: string }, b: { en: string }) => a.en.localeCompare(b.en);

/** Newest year first, then title. */
export async function getPublications(): Promise<Publication[]> {
  return (await getCollection('publications'))
    .sort((a, b) => b.data.year - a.data.year || byEn(a.data.title, b.data.title));
}

/** By `order`, then name. */
export async function getPeople(): Promise<Person[]> {
  return (await getCollection('people'))
    .sort((a, b) => a.data.order - b.data.order || byEn(a.data.name, b.data.name));
}

/** Active before archived, featured first, newest year, then title. Fails the build on unknown member ids. */
export async function getProjects(): Promise<Project[]> {
  const [projects, people] = await Promise.all([getCollection('projects'), getCollection('people')]);
  const ids = new Set(people.map((p) => p.id));
  for (const p of projects) {
    for (const m of p.data.members) {
      if (!ids.has(m.id)) {
        throw new Error(`src/content/projects/${p.id}.yaml: members lists "${m.id}", but src/content/people/${m.id}.yaml does not exist`);
      }
    }
  }
  const rank = (p: Project) => (p.data.status === 'active' ? 0 : 2) + (p.data.featured ? 0 : 1);
  return projects.sort((a, b) =>
    rank(a) - rank(b) || (b.data.year ?? 0) - (a.data.year ?? 0) || byEn(a.data.title, b.data.title));
}

/** Newest academic year first, then student name. */
export async function getTheses(): Promise<Thesis[]> {
  return (await getCollection('theses'))
    .sort((a, b) => b.data.ay - a.data.ay || a.data.student.zh.localeCompare(b.data.student.zh, 'zh-Hant'));
}

/** By `order`, then name. */
export async function getFacilities(): Promise<Facility[]> {
  return (await getCollection('facilities'))
    .sort((a, b) => a.data.order - b.data.order || byEn(a.data.name, b.data.name));
}

/** By `order`. */
export async function getAreas(lang: Locale): Promise<Area[]> {
  return pickLocalized(await getCollection('research'), lang).sort((a, b) => a.data.order - b.data.order);
}

/** Newest first. */
export async function getNews(lang: Locale): Promise<NewsPost[]> {
  return pickLocalized(await getCollection('news'), lang)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || slugOf(a.id).localeCompare(slugOf(b.id)));
}

/** Folder names of a localized collection, for getStaticPaths. */
export async function getSlugs(collection: 'research' | 'news'): Promise<string[]> {
  return [...new Set((await getCollection(collection)).map((e) => slugOf(e.id)))].sort();
}

/** Filter predicate: entries tagged with research area `slug`. */
export const inArea = (slug: string) => (e: { data: { areas: readonly string[] } }) => e.data.areas.includes(slug);

/** Latest end first, then latest start, then title. Fails the build on unknown related ids. */
export async function getGrants(): Promise<Grant[]> {
  const [grants, pubs, theses] = await Promise.all([getCollection('grants'), getCollection('publications'), getCollection('theses')]);
  const pubIds = new Set(pubs.map((p) => p.id));
  const thesisIds = new Set(theses.map((t) => t.id));
  for (const g of grants) {
    for (const r of g.data.related.publications) {
      if (!pubIds.has(r.id)) throw new Error(`src/content/grants/${g.id}.yaml: related.publications lists "${r.id}", but src/content/publications/${r.id}.yaml does not exist`);
    }
    for (const r of g.data.related.theses) {
      if (!thesisIds.has(r.id)) throw new Error(`src/content/grants/${g.id}.yaml: related.theses lists "${r.id}", but src/content/theses/${r.id}.yaml does not exist`);
    }
  }
  return grants.sort((a, b) =>
    b.data.end.localeCompare(a.data.end) || b.data.start.localeCompare(a.data.start) || byEn(a.data.title, b.data.title));
}

/** Newest first. */
export async function getAlbums(): Promise<Album[]> {
  return (await getCollection('albums')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id));
}

/** Lower `order` first. */
export async function getTestimonials(): Promise<Testimonial[]> {
  return (await getCollection('testimonials')).sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}

/** Newest year first. */
export async function getGroupPhotos(): Promise<GroupPhoto[]> {
  return (await getCollection('groupPhotos')).sort((a, b) => b.data.year - a.data.year);
}

/** Newest first. Fails the build on unknown people or publication ids. */
export async function getHonors(): Promise<Honor[]> {
  const [honors, people, pubs] = await Promise.all([getCollection('honors'), getCollection('people'), getCollection('publications')]);
  const peopleIds = new Set(people.map((p) => p.id));
  const pubIds = new Set(pubs.map((p) => p.id));
  for (const h of honors) {
    for (const r of h.data.recipients) {
      if (!peopleIds.has(r.id)) throw new Error(`src/content/honors/${h.id}.yaml: recipients lists "${r.id}", but src/content/people/${r.id}.yaml does not exist`);
    }
    const pub = h.data.publication?.id;
    if (pub && !pubIds.has(pub)) throw new Error(`src/content/honors/${h.id}.yaml: publication "${pub}" is not a file in src/content/publications/`);
  }
  return honors.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || byEn(a.data.title, b.data.title));
}

const AUDIENCES = ['master', 'undergrad', 'intl', 'all'] as const;

/** By audience (master's, undergraduate, international, everyone), then `order`, then question. */
export async function getFaq(): Promise<Faq[]> {
  return (await getCollection('faq')).sort((a, b) =>
    AUDIENCES.indexOf(a.data.audience) - AUDIENCES.indexOf(b.data.audience) || a.data.order - b.data.order || byEn(a.data.q, b.data.q));
}

export type Stat = { key: 'theses' | 'papers' | 'code' | 'grants'; n: number; sinceAy?: number };

/** Home-page numbers, counted at build time. A 0 is left out; funded projects show from three on. */
export async function getStats(): Promise<Stat[]> {
  const [theses, pubs, projects, grants] = await Promise.all([getTheses(), getCollection('publications'), getCollection('projects'), getCollection('grants')]);
  const master = theses.filter((t) => t.data.degree === 'master');
  const stats: Stat[] = [
    { key: 'theses', n: master.length, sinceAy: master.length > 0 ? Math.min(...master.map((t) => t.data.ay)) : undefined },
    { key: 'papers', n: pubs.length },
    { key: 'code', n: projects.filter((p) => p.data.repo).length },
    { key: 'grants', n: grants.length >= 3 ? grants.length : 0 },
  ];
  return stats.filter((s) => s.n > 0);
}
