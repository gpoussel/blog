// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import matter from "gray-matter";
import { unified } from "@astrojs/markdown-remark";
import remarkDirective from "remark-directive";
import remarkGallery from "./src/plugins/remark-gallery.mjs";
import remarkChart from "./src/plugins/remark-chart.mjs";

// Map each blog slug to its last-modified date (updatedDate ?? pubDate) by
// reading post frontmatter at config load, so the sitemap can carry real
// <lastmod> values. Drafts are skipped (they are not built in production).
const BLOG_DIR = "src/content/blog";
function blogLastmod() {
  const map = new Map();
  let names;
  try {
    names = readdirSync(BLOG_DIR);
  } catch {
    return map; // collection directory may not exist yet
  }
  for (const name of names) {
    if (!name.endsWith(".md")) continue;
    const { data } = matter(readFileSync(join(BLOG_DIR, name), "utf8"));
    if (data.draft === true) continue;
    const date = data.updatedDate ?? data.pubDate;
    if (date) map.set(name.replace(/\.md$/, ""), new Date(date).toISOString());
  }
  return map;
}
const LASTMOD = blogLastmod();

// Production domain (used for RSS, sitemap, canonical URLs, and OG images).
export default defineConfig({
  site: "https://gpoussel.fr",
  // Asset-transform cache (responsive AVIF/WebP variants). Kept outside
  // node_modules (the default is node_modules/.astro) so CI can persist it
  // across runs with actions/cache: deploys then only encode new images.
  cacheDir: "./.astro-cache",
  integrations: [
    sitemap({
      serialize(item) {
        // Attach <lastmod> to blog post entries (/blog/<slug>/).
        const match = item.url.match(/\/blog\/([^/]+)\/?$/);
        const lastmod = match && LASTMOD.get(match[1]);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
    icon(),
  ],
  image: { layout: "constrained" },
  markdown: {
    // remarkDirective parses the `:::` syntax; remarkGallery and remarkChart
    // (after it) turn those blocks into the lightbox grid and static SVG charts
    // respectively. Order matters. They live on the unified() processor (Astro
    // 6's replacement for `markdown.remarkPlugins`); shikiConfig below stays
    // top-level and is merged in by the processor.
    processor: unified({
      remarkPlugins: [remarkDirective, remarkGallery, remarkChart],
    }),
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: true,
    },
  },
});
