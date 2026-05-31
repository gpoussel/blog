# Personal blog

A personal blog built with [Astro](https://astro.build). Notes on technology, AI, and
travel. Markdown content, light/dark theme, topographic-contour background.

## Getting started

```bash
pnpm install      # install dependencies
pnpm dev          # dev server on http://localhost:4321
pnpm build        # generate the static site into dist/
pnpm preview      # preview the build
```

## Writing a post

Create a `.md` file in `src/content/blog/`. The filename becomes the URL
(`/blog/my-post/`). Expected frontmatter:

```markdown
---
title: "Post title"
description: "Summary shown in listings and for SEO."
pubDate: 2026-05-31
category: "artificial intelligence"
cover: "https://images.unsplash.com/photo-..."   # stock photo or /local/path
coverAlt: "Image description for accessibility"
coverCredit: "Photo credit (optional)"
draft: false                                       # true = hidden in production
---

Your **Markdown** content...
```

## Customize

- **Identity, navigation, socials**: `src/consts.ts` (name, LinkedIn, GitHub).
- **Colors, type, motion**: `src/styles/global.css` (OKLCH tokens), see `DESIGN.md`.
- **Strategy & voice**: `PRODUCT.md`.
- **Domain** (RSS, sitemap, canonical): the `site` field in `astro.config.mjs`.

## Structure

```
src/
  components/   Header, Footer, ThemeToggle, PostCard, TopoBackground
  content/blog/ the posts (.md)
  layouts/      BaseLayout
  pages/        index, about, blog/[...slug], rss.xml
  styles/       global.css (design system)
  utils/        helpers (posts, dates, reading time)
```
