// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// Replace with your real domain once deployed (used for RSS, sitemap, canonical URLs).
export default defineConfig({
  site: "https://example.com",
  integrations: [sitemap(), icon()],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: true,
    },
  },
});
