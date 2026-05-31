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
cover: "https://images.unsplash.com/photo-..." # stock photo or /local/path
coverAlt: "Image description for accessibility"
coverCredit: "Photo credit (optional)"
draft: false # true = hidden in production
---

Your **Markdown** content...
```

## Customize

- **Identity, navigation, socials**: `src/consts.ts` (name, LinkedIn, GitHub).
- **Colors, type, motion**: `src/styles/global.css` (OKLCH tokens), see `DESIGN.md`.
- **Strategy & voice**: `PRODUCT.md`.
- **Domain** (RSS, sitemap, canonical): the `site` field in `astro.config.mjs`.

## Deployment

The site auto-deploys to an SFTP server on every push to `main`, via the
`.github/workflows/deploy.yml` GitHub Actions workflow (build with pnpm, then
upload `dist/` with `lftp mirror`).

The workflow is hardened for a public repository:

- No `pull_request` trigger, so PRs (including from forks) never deploy or read secrets.
- `if: github.repository == 'gpoussel/blog'` makes the job a no-op on forks.
- Secrets live in a protected `production` environment whose branch policy allows `main` only.
- Read-only token (`contents: read`), no third-party deploy action, official actions pinned by SHA.
- Strict SFTP host-key verification (`SFTP_KNOWN_HOSTS`) to defeat man-in-the-middle.

### One-time setup

Store the secrets in the `production` environment (Settings, Environments,
production), for example with the `gh` CLI:

```bash
gh secret set SFTP_HOST       --env production --body "your.server.tld"
gh secret set SFTP_PORT       --env production --body "22"
gh secret set SFTP_USERNAME   --env production --body "your_user"
gh secret set SFTP_TARGET_DIR --env production --body "/path/to/www"
gh secret set SFTP_PASSWORD   --env production   # then type the password on stdin

# pin the server's host key (adjust the port)
ssh-keyscan -p 22 your.server.tld | gh secret set SFTP_KNOWN_HOSTS --env production
```

Note: the upload uses `mirror --delete`, so the target directory is kept as an
exact copy of `dist/` (files removed from the build are removed on the server).

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
