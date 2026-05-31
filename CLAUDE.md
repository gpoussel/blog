# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses **pnpm** (pinned via `packageManager` in `package.json`). Do not introduce `package-lock.json`.

```bash
pnpm install      # install dependencies
pnpm dev          # dev server on http://localhost:4321
pnpm build        # static build into dist/
pnpm preview      # preview the production build
```

There is no test runner or linter configured. Type safety comes from `tsconfig.json` (extends `astro/tsconfigs/strict`); there is no standalone `check` script wired up (Astro's `astro check` would require adding `@astrojs/check`).

## Architecture

A static personal blog built with **Astro 6** (output: `static`). English-language, light/dark theme, with a generated topographic-contour background as the signature motif.

**Single source of truth for identity** is `src/consts.ts`: `SITE` (title, tagline, description, `lang`), `NAV`, and `SOCIALS` (each social carries an iconify `icon` name). Most user-facing chrome reads from here rather than hardcoding strings.

**Content is a typed collection.** Posts are Markdown in `src/content/blog/`, loaded by the glob loader and validated against the Zod schema in `src/content.config.ts`. The filename becomes the URL slug (`/blog/<filename>/`). The collection may be empty (demo posts were removed) — the build then prints harmless "collection blog is empty" warnings until posts are added. Never read the collection directly in pages; go through `src/utils/posts.ts`:
- `getPublishedPosts()` — newest-first, excludes `draft: true` in production. Used by the home page, `blog/[...slug].astro` (`getStaticPaths`), and `rss.xml.js`.
- `readingTime()` and `formatDate()` (locale `en-US`) for post metadata.

**Pages** (`src/pages/`): `index.astro`, `about.astro`, `blog/[...slug].astro`, `rss.xml.js`. All wrap `layouts/BaseLayout.astro`, which sets `<head>`, SEO/OG tags, and the canonical URL. The `site` field in `astro.config.mjs` (currently the placeholder `https://example.com`) feeds canonical URLs, RSS, and the sitemap — update it on deploy.

**Theming is FOUC-free.** `BaseLayout.astro` runs an inline `<script>` in `<head>` that sets `data-theme` from `localStorage` (falling back to `prefers-color-scheme`) *before first paint*. `components/ThemeToggle.astro` flips and persists it. Both `:root` and `:root[data-theme="dark"]` token sets live in `src/styles/global.css`.

**The design system lives in `src/styles/global.css`** as OKLCH custom properties (color, fluid type scale, spacing, motion easings, z-index scale). `DESIGN.md` is the authoritative visual spec and `PRODUCT.md` the brand/voice brief — consult them before changing visuals; the palette strategy is intentionally "restrained" (cool slate primary, mauve accent ≤10%).

**`components/TopoBackground.astro`** generates the contour-line background at build time: fBm value-noise field → marching squares → stitched, smoothed SVG polylines. It is deliberately **deterministic** (no `Math.random`/`Date.now`) so builds are reproducible — preserve that if editing. It is purely decorative (`aria-hidden`, `position: fixed`, very low opacity).

**Icons** use `astro-icon` (integration registered in `astro.config.mjs`). Reference iconify names: brand logos from `@iconify-json/simple-icons` (e.g. `simple-icons:github`), UI glyphs from `@iconify-json/lucide` (e.g. `lucide:coffee`). Icons render as inline SVG using `currentColor`.

## Conventions

- The site is **English**; the eyebrow label marker and other UI text avoid em dashes (`—`) by preference — use commas, colons, or parentheses.
- Keep changes on-brand per `DESIGN.md` (reading-first, restrained, two equal themes); respect `prefers-reduced-motion` (every animation has a reduced alternative).
