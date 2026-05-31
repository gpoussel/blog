// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// Production domain (used for RSS, sitemap, canonical URLs, and OG images).
export default defineConfig({
  site: "https://gpoussel.fr",
  integrations: [sitemap(), icon()],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: true,
    },
  },
});
