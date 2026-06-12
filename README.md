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
categories: ["AI"] # one or more; each gets a /category/<slug>/ page
cover: "https://images.unsplash.com/photo-..." # stock photo or /local/path
coverAlt: "Image description for accessibility"
coverCredit: "Photo credit (optional)"
draft: false # true = hidden in production
---

Your **Markdown** content...
```

Every post embeds a [GraphComment](https://graphcomment.com/) thread under
its footer, a hosted third-party service: its script is loaded only once the
reader scrolls near the thread.

## Customize

- **Identity, navigation, socials**: `src/consts.ts` (name, LinkedIn, GitHub).
- **Colors, type, motion**: `src/styles/global.css` (OKLCH tokens), see `DESIGN.md`.
- **Strategy & voice**: `PRODUCT.md`.
- **Domain** (RSS, sitemap, canonical): the `site` field in `astro.config.mjs`.

## Deployment

The site auto-deploys to the server on every push to `main`, via the
`.github/workflows/deploy.yml` GitHub Actions workflow (build with pnpm, then
upload `dist/` with `rsync --checksum` over SSH).

The workflow also runs daily at 06:30 UTC so a post merged ahead of time goes
live on its `pubDate` (production builds exclude future-dated posts). A cheap
`gate` job compares the set of published posts against the last successful run
(`scripts/scheduled-deploy-gate.ts`, frontmatter read straight from git) and
skips the build+deploy when nothing changed, so the no-op days cost seconds.
Push and manual runs always deploy; nothing deploys off `main`. Note that
GitHub disables `schedule` triggers after about 60 days without repo activity
(it emails a warning first), so a far-future post in a quiet repo may need the
schedule re-enabled from the Actions tab.

The workflow is hardened for a public repository:

- No `pull_request` trigger, so PRs (including from forks) never deploy or read secrets.
- `if: github.repository == 'gpoussel/blog'` makes the job a no-op on forks.
- Secrets live in a protected `production` environment whose branch policy allows `main` only.
- Read-only token (`contents: read`), no third-party deploy action, official actions pinned by SHA.
- Strict SSH host-key verification (`SFTP_KNOWN_HOSTS`) to defeat man-in-the-middle.

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

Note: the upload uses `rsync --checksum --delete-after`. `--checksum` keeps deploys
incremental (only files whose contents actually changed are sent, despite the build
giving every file a fresh mtime), and `--delete-after` keeps the target directory an
exact copy of `dist/` (files removed from the build are pruned on the server, after a
clean upload). The server needs `rsync` available over SSH.

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
