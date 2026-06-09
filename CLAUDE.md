# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses **pnpm** (pinned via `packageManager` in `package.json`). Do not introduce `package-lock.json`.

```bash
pnpm install      # install dependencies (also sets up the Husky git hooks)
pnpm dev          # dev server on http://localhost:4321
pnpm build        # static build into dist/
pnpm preview      # preview the production build

pnpm lint         # everything CI runs: format check + astro check + Markdown + frontmatter
pnpm format       # auto-format the whole repo with Prettier
pnpm check        # astro check only (types / diagnostics)
pnpm lint:md      # markdownlint-cli2 on src/content/blog/**/*.md
pnpm lint:content # validate post frontmatter against the schema
```

**Linting is enforced, not optional.** `pnpm lint` is exactly what the `Lint` GitHub Actions workflow runs, and it is a **required status check on `main`**, so a PR cannot merge unless it passes. It chains Prettier (`--check`), `astro check` (type/diagnostics, via `@astrojs/check`, the source of type safety alongside `tsconfig.json` which extends `astro/tsconfigs/strict`), `markdownlint-cli2`, and the frontmatter validator. There is no unit-test runner.

## Architecture

A static personal blog built with **Astro 6** (output: `static`). English-language, light/dark theme, with a generated topographic-contour background as the signature motif.

**Single source of truth for identity** is `src/consts.ts`: `SITE` (title, tagline, description, `lang`), `NAV`, and `SOCIALS` (each social carries an iconify `icon` name). Most user-facing chrome reads from here rather than hardcoding strings.

**Content is a typed collection.** Posts are Markdown in `src/content/blog/`, loaded by the glob loader and validated against the Zod schema in `src/schemas/post.ts` (wired into the collection by `src/content.config.ts`, and reused by the frontmatter linter so the "expected header" has one definition). The filename becomes the URL slug (`/blog/<filename>/`). The collection may be empty (demo posts were removed) — the build then prints harmless "collection blog is empty" warnings until posts are added. Never read the collection directly in pages; go through `src/utils/posts.ts`:

- `getPublishedPosts()` — newest-first, excludes `draft: true` in production. Used by the home page, `blog/[...slug].astro` (`getStaticPaths`), and `rss.xml.js`.
- `readingTime()` and `formatDate()` (locale `en-US`) for post metadata.

**Pages** (`src/pages/`): `index.astro`, `about.astro`, `blog/[...slug].astro`, `rss.xml.js`, and `og/[...route].png.ts` (generated social images, below). All HTML pages wrap `layouts/BaseLayout.astro`, which sets `<head>`, SEO/OG tags, and the canonical URL. The `site` field in `astro.config.mjs` (`https://gpoussel.fr`) feeds canonical URLs, RSS, the sitemap, and the OG image URLs/footer host.

**Theming is FOUC-free.** `BaseLayout.astro` runs an inline `<script>` in `<head>` that sets `data-theme` from `localStorage` (falling back to `prefers-color-scheme`) _before first paint_. `components/ThemeToggle.astro` flips and persists it. Both `:root` and `:root[data-theme="dark"]` token sets live in `src/styles/global.css`.

**The design system lives in `src/styles/global.css`** as OKLCH custom properties (color, fluid type scale, spacing, motion easings, z-index scale). `DESIGN.md` is the authoritative visual spec and `PRODUCT.md` the brand/voice brief — consult them before changing visuals; the palette strategy is intentionally "restrained" (cool slate primary, mauve accent ≤10%).

**`components/TopoBackground.astro`** generates the contour-line background at build time: fBm value-noise field → marching squares → stitched, smoothed SVG polylines. It is deliberately **deterministic** (no `Math.random`/`Date.now`) so builds are reproducible — preserve that if editing. It is purely decorative (`aria-hidden`, `position: fixed`, very low opacity).

**Images.** Phone photos are processed offline by `scripts/process-photo.ts` (run `pnpm photo <file|dir> [--max <px>] [--out <slug>]`), which shells out to **ImageMagick** (`magick`, install via `winget install ImageMagick.ImageMagick`) to gently correct tone (`-auto-level`, a non-clipping tonal stretch that preserves highlights), fix EXIF orientation, strip metadata, and downscale to a master JPEG in `src/assets/photos/`. That master is the source of truth in the repo; the heavy compression to **AVIF** (responsive `srcset`) happens at build via `astro:assets`. The post `cover` field is resolved by `src/utils/cover.ts`: a local filename → optimised `<Image format="avif">`, an `http(s)://` value → plain `<img>` (Unsplash stock, the 404 page). A local `cover` that has no matching file in `src/assets/photos/` throws at build on purpose. (The about page imports its photos directly via `astro:assets` rather than going through this resolver.) For social previews, the post's `cover` is rendered into a generated PNG card (see OG images below) rather than exposed to scrapers directly.

**In-post galleries.** A post body can group 1-4 photos in a `:::gallery` directive. `remark-directive` parses the `:::` syntax and the local `src/plugins/remark-gallery.mjs` plugin (both live on the `unified()` markdown processor in `astro.config.mjs`, Astro 6's replacement for the deprecated `markdown.remarkPlugins`) turn it into a grid: 1/2/3 images on one row, 4 as a 2×2. Bare filenames resolve to `src/assets/photos/` exactly like `cover`; explicit relative paths and `http(s)://` URLs pass through. `image.layout: "constrained"` (in `astro.config.mjs`) makes those in-content Markdown images responsive AVIF/WebP. Each tile is a `<button>` that opens `components/Lightbox.astro` — a single shared native `<dialog>` (also used by the about page's "From the road" strip) showing the photo at full size with **the image alt as the caption**. The lightbox is keyboard-navigable and honours `prefers-reduced-motion`; the authoring side is documented for writers in the `blog-writing` skill.

**OG / social images are generated at build.** `src/pages/og/[...route].png.ts` is an endpoint whose `getStaticPaths` enumerates one card per page (`/og/home.png`, `/og/about.png`, `/og/blog/<slug>.png`); `BaseLayout` points each page's `og:image`/`twitter:image` at its route via the `ogRoute` prop (defaulting to `home`, which also covers the 404). The rendering lives in `src/utils/og.ts`: **satori** turns a flexbox HTML tree (via `satori-html`) into SVG, then **sharp** rasterises it to a 1200×630 PNG. Every card carries the site logo (favicon mark recoloured in hex) + title + description over the slate "dark mode" background; the topo motif is baked in by reusing `src/utils/topo.ts` (the shared contour generator that also feeds `TopoBackground.astro`). Blog cards additionally show the post `cover` (local file or remote URL) in a right-hand panel. Notes if you touch this: satori needs **static** fonts (committed TTFs in `src/assets/og-fonts/`, since the repo's `@fontsource` packages ship variable woff2 satori can't read); it reads image/font bytes via `process.cwd()` (build-time only), supports a constrained CSS subset (flexbox only, no grid, **no `z-index`** — paint order is DOM order), and colours must be hex/rgb (not the OKLCH tokens). Static-page titles/descriptions are shared with the pages via `src/utils/page-meta.ts` so the card and the `<head>` cannot drift.

**Icons** use `astro-icon` (integration registered in `astro.config.mjs`). Reference iconify names: brand logos from `@iconify-json/simple-icons` (e.g. `simple-icons:github`), UI glyphs from `@iconify-json/lucide` (e.g. `lucide:coffee`). Icons render as inline SVG using `currentColor`.

## Deployment & CI

**Auto-deploy is GitHub Actions, defined in `.github/workflows/deploy.yml`.** On every push to `main` (and via manual `workflow_dispatch`) it builds with pnpm and uploads `dist/` to the server with `rsync` over SSH (auth via `sshpass`, no third-party deploy action). It is deliberately hardened for a public repo, preserve all of this if you touch the workflow:

- No `pull_request` trigger and a `if: github.repository == 'gpoussel/blog'` fork guard, so PRs and forks can never deploy or read secrets.
- Secrets live in the protected **`production` environment** (branch policy: `main` only), not at repo level: `SFTP_HOST`, `SFTP_PORT`, `SFTP_USERNAME`, `SFTP_PASSWORD`, `SFTP_TARGET_DIR`, `SFTP_KNOWN_HOSTS`. The README documents the one-time setup.
- Least-privilege token (`permissions: contents: read`), third-party actions **pinned by commit SHA** (pin any new action you add), and strict SSH host-key verification via `SFTP_KNOWN_HOSTS` (do not switch to `StrictHostKeyChecking=no`).
- The upload uses `rsync --checksum --delete-after`: `--checksum` makes deploys incremental (it compares file _contents_, not size+mtime, so the always-fresh build timestamps don't trigger a full re-upload every run), and `--delete-after` makes the remote an exact copy of `dist/` (remote-only files are pruned, but only after a clean upload). Drop the delete only if the target dir holds files that must survive.

**`main` is protected by GitHub rulesets** (configured server-side, not in the repo): commits must be **signed and verified**, changes must land via **pull request**, and force-pushes / deletions are blocked. Practical consequences when working here:

- Commit signing is required. SSH commit signing is set up globally on this machine, so commits are signed automatically; a new environment must configure `commit.gpgsign`/`gpg.format=ssh` and register the public key on GitHub, or pushes to `main` are rejected.
- Never rewrite published `main` history. Doing so needs the protections temporarily lifted (a privileged, hard-to-reverse step) and auto-closes open PRs; merge via a PR instead. GitHub signs the merge commit itself (web-flow), so it satisfies the signature rule.

## Linting & formatting

The toolchain (config at the repo root) covers `.astro`, `.js`/`.ts`, JSON, CSS, and Markdown:

- **Prettier owns all formatting** (`.prettierrc.json` registers `prettier-plugin-astro`; `.prettierignore` excludes `dist`, `node_modules`, `.astro`, the lockfile). Run `pnpm format` after edits. `.editorconfig` mirrors the same whitespace rules for editors.
- **`astro check`** (`@astrojs/check`) is the type/diagnostics pass over `.astro`/`.ts`. Ambient module declarations for type-less side-effect imports live in `src/env.d.ts` (e.g. the `@fontsource-variable/*` CSS packages); add to it rather than disabling the check.
- **Markdown is linted two ways**: `markdownlint-cli2` (`.markdownlint-cli2.jsonc`, scoped to `src/content/blog/**/*.md`) checks _content_ correctness, with formatting rules disabled so it never fights Prettier; `scripts/check-frontmatter.ts` validates each post's _frontmatter_ against `src/schemas/post.ts` via `gray-matter` + Zod. Keep that schema the single source of truth (the Astro collection imports the same file).
- **Git hooks via Husky** (`.husky/`, installed by the `prepare` script on `pnpm install`): `pre-commit` runs `lint-staged` (Prettier, plus `markdownlint --fix` on blog Markdown); `pre-push` runs the non-format checks. Don't bypass with `--no-verify`.
- Scope is **format + types + Markdown**, not full code-style linting. If stricter JS/TS rules are wanted later, add ESLint (`eslint-plugin-astro` + `typescript-eslint`) as another step in the `lint` script and the `Lint` workflow.

## Conventions

- The site is **English**; the eyebrow label marker and other UI text avoid em dashes (`—`) by preference — use commas, colons, or parentheses.
- Keep changes on-brand per `DESIGN.md` (reading-first, restrained, two equal themes); respect `prefers-reduced-motion` (every animation has a reduced alternative).

## Git commits (tooling gotcha)

- **Multi-line commit messages: don't mix shells.** The PowerShell here-string form (`git commit -m @'…'@`) only works in a PowerShell shell. Running it through a Bash shell passes the `@'` / `'@` delimiters **literally**, leaving a stray `@` on the first and last lines of the message. This has bitten us more than once. Either commit from PowerShell with the here-string, or — when using a Bash shell — feed the message via a heredoc to `-F`:

  ```bash
  git commit -F - <<'EOF'
  Subject line

  Body paragraph.

  Co-Authored-By: …
  EOF
  ```
