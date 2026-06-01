// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import { unified } from "@astrojs/markdown-remark";
import remarkDirective from "remark-directive";
import remarkGallery from "./src/plugins/remark-gallery.mjs";
import remarkChart from "./src/plugins/remark-chart.mjs";

// Production domain (used for RSS, sitemap, canonical URLs, and OG images).
export default defineConfig({
  site: "https://gpoussel.fr",
  integrations: [sitemap(), icon()],
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
