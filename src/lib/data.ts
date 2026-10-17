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
