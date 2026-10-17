// JSON-LD for search engines: the site, the lab as a ResearchOrganization inside NCUE EE, and (on People) the PI.
// Plain functions over plain data, so tests can call them without Astro.

const DEPARTMENT = { en: 'Department of Electrical Engineering', zh: '電機工程學系' };
const UNIVERSITY = { en: 'National Changhua University of Education', zh: '國立彰化師範大學' };

/**
 * Serialise for <script type="application/ld+json">: with <, > and & escaped, no value can close the element.
 * @param {unknown} value
 */
export function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

/**
 * The WebSite and ResearchOrganization nodes that every page carries.
 * @param {{ origin: string, lang: 'en' | 'zh', inLanguage: string, home: string, name: { en: string, zh: string },
 *   email: string, address: { en: string, zh: string }, logo: string, sameAs: string[] }} o
 */
export function siteNodes(o) {
  const lab = `${o.origin}/#lab`;
  const other = o.lang === 'en' ? 'zh' : 'en';
  return [
    { '@type': 'WebSite', '@id': `${o.home}#website`, name: o.name[o.lang], url: o.home, inLanguage: o.inLanguage, publisher: { '@id': lab } },
    {
      '@type': 'ResearchOrganization', '@id': lab, name: o.name[o.lang], alternateName: o.name[other],
      url: `${o.origin}/`, logo: o.logo, email: o.email, address: o.address[o.lang], sameAs: o.sameAs,
      parentOrganization: {
        '@type': 'EducationalOrganization', name: DEPARTMENT[o.lang],
        parentOrganization: { '@type': 'CollegeOrUniversity', name: UNIVERSITY[o.lang] },
      },
    },
  ];
}

/**
 * A person who works in the lab (the PI on the People page). Undefined fields are dropped by JSON.stringify.
 * @param {{ origin: string, name: string, alternateName?: string, jobTitle?: string, email?: string,
 *   sameAs: string[], image?: string, url?: string }} p
 */
export function personNode(p) {
  return {
    '@type': 'Person', name: p.name, alternateName: p.alternateName, jobTitle: p.jobTitle, email: p.email,
    image: p.image, url: p.url, sameAs: p.sameAs, worksFor: { '@id': `${p.origin}/#lab` },
  };
}

/** @param {object[]} nodes */
export const graph = (nodes) => ({ '@context': 'https://schema.org', '@graph': nodes });
