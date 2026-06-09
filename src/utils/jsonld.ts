// Builders for schema.org JSON-LD structured data, embedded by BaseLayout.
// Helps search engines understand who the author is and what each page is
// (a WebSite, a personal ProfilePage, or an individual BlogPosting). All nodes
// reuse the same author Person so identity stays consistent across pages.

import { SITE, SOCIALS } from "../consts";

export type JsonLd = Record<string, unknown>;

/** The site author as a schema.org Person; reused as author and publisher. */
function person(site: URL): JsonLd {
  return {
    "@type": "Person",
    name: SITE.author,
    url: site.href,
    sameAs: SOCIALS.map((s) => s.href),
  };
}

/** Sitewide WebSite node (home page). */
export function websiteJsonLd(site: URL): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.title,
    description: SITE.description,
    url: site.href,
    inLanguage: SITE.lang,
    author: person(site),
  };
}

/** ProfilePage node describing the author (about page). */
export function profileJsonLd(site: URL): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: new URL("/about", site).href,
    inLanguage: SITE.lang,
    mainEntity: person(site),
  };
}

interface ArticleInput {
  title: string;
  description: string;
  /** Canonical URL of the post. */
  url: URL;
  /** Absolute URL of the social/OG image. */
  image: URL;
  datePublished: string;
  dateModified?: string;
  /** Category name(s); schema.org accepts a single Text or a list. */
  section?: string | string[];
}

/** BlogPosting node for a single post. */
export function articleJsonLd(site: URL, a: ArticleInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    url: a.url.href,
    image: a.image.href,
    datePublished: a.datePublished,
    dateModified: a.dateModified ?? a.datePublished,
    inLanguage: SITE.lang,
    mainEntityOfPage: { "@type": "WebPage", "@id": a.url.href },
    ...(a.section && a.section.length ? { articleSection: a.section } : {}),
    author: person(site),
    publisher: person(site),
  };
}
