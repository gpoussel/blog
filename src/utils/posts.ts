import { getCollection, type CollectionEntry } from "astro:content";
import { isPubDateReached, utcDateStamp } from "./publication";

export type Post = CollectionEntry<"blog">;

/** Posts per page on the home and category lists. The home page additionally
 *  shows a featured card (the newest post) above the grid on page 1 only, so
 *  home page 1 holds 1 + PAGE_SIZE posts and every other page exactly PAGE_SIZE. */
export const PAGE_SIZE = 8;

/** All published posts, newest first. Drafts and future-dated posts are
 *  excluded in production (scheduling, issue #16); `pnpm dev` shows everything
 *  so scheduled posts stay previewable. */
export async function getPublishedPosts(): Promise<Post[]> {
  const today = utcDateStamp(new Date());
  const posts = await getCollection("blog", ({ data }) => {
    return import.meta.env.PROD
      ? data.draft !== true && isPubDateReached(data.pubDate, today)
      : true;
  });
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

// Categories are free-form strings in frontmatter, normalized on read: the
// display name keeps its casing but trims and collapses whitespace, while the
// *identity* of a category is its slug, so "Code golf" and "code golf" are one
// category (the display name is the first one encountered, newest post first).

function normalizeCategory(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** URL-safe slug for a category name, e.g. "Code golf" -> "code-golf". */
export function slugify(category: string): string {
  return normalizeCategory(category)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents: "Randonnée" -> "randonnee"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A post's categories, normalized and de-duplicated (by slug), in order. */
export function postCategories(post: Post): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of post.data.categories) {
    const name = normalizeCategory(raw);
    const slug = slugify(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    names.push(name);
  }
  return names;
}

export interface Category {
  /** Display name (first casing encountered, newest post first). */
  name: string;
  /** URL slug, used in /category/<slug>/ routes. */
  slug: string;
  /** Number of published posts in the category. */
  count: number;
}

/** Unique categories across all published posts, most-used first. */
export async function getCategories(): Promise<Category[]> {
  const posts = await getPublishedPosts();
  const bySlug = new Map<string, Category>();
  for (const post of posts) {
    for (const name of postCategories(post)) {
      const slug = slugify(name);
      const entry = bySlug.get(slug);
      if (entry) entry.count += 1;
      else bySlug.set(slug, { name, slug, count: 1 });
    }
  }
  return [...bySlug.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

/** Published posts in a category (matched by slug), newest first. */
export async function getPostsByCategory(category: string): Promise<Post[]> {
  const slug = slugify(category);
  const posts = await getPublishedPosts();
  return posts.filter((post) =>
    postCategories(post).some((name) => slugify(name) === slug),
  );
}

/** Estimated reading time in minutes from the raw Markdown. */
export function readingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/[#>*_~\-]/g, " "); // Markdown punctuation
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
