// Builders for schema.org JSON-LD structured data, embedded by BaseLayout.
// Helps search engines (and LLM crawlers) understand who the author is and what
// each page is: a WebSite, a Blog, a personal ProfilePage, a CollectionPage, or
// an individual BlogPosting.
//
// The shape follows the "@graph" convention: every page emits one JSON-LD
// document whose nodes are linked by stable "@id" anchors, so the author Person
// (`#person`), the WebSite (`#website`), and the Blog (`#blog`) are defined once
// and merely *referenced* elsewhere. Search engines stitch the per-page graphs
// back together by @id, so identity stays consistent across the whole site
// without re-describing the author on every page.

import { SITE, SOCIALS } from "../consts";
// The author portrait also shown on the About page; reused here so the Person
// node carries an image (a strong identity signal for search/LLM crawlers).
import portrait from "../assets/photos/myself.jpg";

export type JsonLd = Record<string, unknown>;

// Stable @id anchors, resolved against the site origin so they are absolute and
// identical on every page (the spec keys on the literal @id string).
const id = (site: URL, hash: string) => new URL(`/#${hash}`, site).href;
const personId = (site: URL) => id(site, "person");
const websiteId = (site: URL) => id(site, "website");
const blogId = (site: URL) => id(site, "blog");

/** Reference to a node defined (in full) elsewhere in the graph. */
const ref = (atId: string): JsonLd => ({ "@id": atId });

/**
 * The site author as a schema.org Person, defined in full. Reused as author and
 * publisher across the site; other nodes point at it via `ref(personId(site))`.
 */
function person(site: URL): JsonLd {
  return {
    "@type": "Person",
    "@id": personId(site),
    name: SITE.author,
    givenName: "Guillaume",
    familyName: "Poussel",
    alternateName: "gpoussel",
    url: site.href,
    jobTitle: "Software architect",
    description: SITE.description,
    disambiguatingDescription: SITE.tagline,
    knowsAbout: [
      "Software architecture",
      "Software engineering",
      "Artificial intelligence",
      "Competitive programming",
      "Travel",
    ],
    knowsLanguage: ["en", "fr"],
    image: {
      "@type": "ImageObject",
      "@id": id(site, "person-image"),
      url: new URL(portrait.src, site).href,
      width: portrait.width,
      height: portrait.height,
      caption: SITE.author,
    },
    // sameAs is the key disambiguation signal: it links this Person to its
    // profiles on other platforms so engines can merge them into one identity.
    sameAs: SOCIALS.map((s) => s.href),
  };
}

/** The WebSite node, defined in full (used on the home page). */
function websiteFull(site: URL): JsonLd {
  return {
    "@type": "WebSite",
    "@id": websiteId(site),
    url: site.href,
    name: SITE.title,
    alternateName: site.host,
    description: SITE.description,
    inLanguage: SITE.lang,
    publisher: ref(personId(site)),
  };
}

/** A lightweight reference-only WebSite, for pages other than the home page. */
function websiteRef(site: URL): JsonLd {
  return {
    "@type": "WebSite",
    "@id": websiteId(site),
    url: site.href,
    name: SITE.title,
  };
}

/** A single breadcrumb trail (Home is always position 1). */
function breadcrumb(
  pageUrl: URL,
  site: URL,
  trail: { name: string; url: URL }[],
): JsonLd {
  const items = [{ name: "Home", url: site }, ...trail];
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl.href}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.href,
    })),
  };
}

/** Wrap a list of nodes into a single JSON-LD graph document. */
const graph = (nodes: JsonLd[]): JsonLd => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});

/**
 * Home page graph: the full WebSite + author Person, plus a Blog node (the home
 * is the post index), so individual posts can reference `#blog`.
 */
export function homeJsonLd(site: URL): JsonLd {
  return graph([
    websiteFull(site),
    person(site),
    {
      "@type": "Blog",
      "@id": blogId(site),
      url: site.href,
      name: SITE.title,
      description: SITE.description,
      inLanguage: SITE.lang,
      isPartOf: ref(websiteId(site)),
      publisher: ref(personId(site)),
      author: ref(personId(site)),
    },
  ]);
}

/** ProfilePage graph describing the author (about page). */
export function profileJsonLd(site: URL): JsonLd {
  const url = new URL("/about/", site);
  return graph([
    websiteRef(site),
    person(site),
    {
      "@type": "ProfilePage",
      "@id": `${url.href}#webpage`,
      url: url.href,
      name: "About",
      inLanguage: SITE.lang,
      isPartOf: ref(websiteId(site)),
      mainEntity: ref(personId(site)),
      about: ref(personId(site)),
      breadcrumb: ref(`${url.href}#breadcrumb`),
    },
    breadcrumb(url, site, [{ name: "About", url }]),
  ]);
}

interface CategoryInput {
  name: string;
  /** Canonical URL of the category's first page. */
  url: URL;
  description: string;
}

/** CollectionPage graph for a category listing. */
export function categoryJsonLd(site: URL, c: CategoryInput): JsonLd {
  return graph([
    websiteRef(site),
    person(site),
    {
      "@type": "CollectionPage",
      "@id": `${c.url.href}#webpage`,
      url: c.url.href,
      name: c.name,
      description: c.description,
      inLanguage: SITE.lang,
      isPartOf: ref(websiteId(site)),
      breadcrumb: ref(`${c.url.href}#breadcrumb`),
    },
    breadcrumb(c.url, site, [{ name: c.name, url: c.url }]),
  ]);
}

interface ArticleInput {
  title: string;
  description: string;
  /** Canonical URL of the post. */
  url: URL;
  /** Absolute URL of the social/OG image (the 1200x630 generated card). */
  image: URL;
  datePublished: string;
  dateModified?: string;
  /** Category name(s); schema.org accepts a single Text or a list. */
  section?: string | string[];
}

/**
 * Blog post graph: the WebPage being viewed, its breadcrumb, and the BlogPosting
 * itself. The BlogPosting points at the shared `#person` (author + publisher)
 * and `#blog` (defined on the home page) by @id, so the post inherits the site's
 * identity without redefining it.
 */
export function articleJsonLd(site: URL, a: ArticleInput): JsonLd {
  return graph([
    websiteRef(site),
    person(site),
    {
      "@type": "WebPage",
      "@id": `${a.url.href}#webpage`,
      url: a.url.href,
      name: a.title,
      inLanguage: SITE.lang,
      isPartOf: ref(websiteId(site)),
      breadcrumb: ref(`${a.url.href}#breadcrumb`),
    },
    breadcrumb(a.url, site, [{ name: a.title, url: a.url }]),
    {
      "@type": "BlogPosting",
      "@id": `${a.url.href}#blogposting`,
      url: a.url.href,
      headline: a.title,
      description: a.description,
      inLanguage: SITE.lang,
      datePublished: a.datePublished,
      dateModified: a.dateModified ?? a.datePublished,
      mainEntityOfPage: ref(`${a.url.href}#webpage`),
      isPartOf: ref(blogId(site)),
      author: ref(personId(site)),
      publisher: ref(personId(site)),
      image: {
        "@type": "ImageObject",
        "@id": `${a.url.href}#blogposting-image`,
        url: a.image.href,
        width: 1200,
        height: 630,
      },
      ...(a.section && a.section.length
        ? {
            articleSection: a.section,
            keywords: Array.isArray(a.section)
              ? a.section.join(", ")
              : a.section,
          }
        : {}),
    },
  ]);
}
