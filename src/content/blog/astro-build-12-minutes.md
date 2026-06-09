---
title: "Why did my seven-page blog take 12 minutes to deploy?"
description: "My static Astro blog took 12 minutes to build and deploy. The time went to satori-html parsing 320 KB data URIs quadratically in the OG image step, and to AVIF encodings thrown away with every GitHub Actions run. Both fixes are a few lines."
pubDate: 2026-06-09
category: "Web"
cover: "astro-build-perf.jpg"
coverAlt: "A field of hot air balloons at dawn, a few already in the air, most still inflating on the ground."
coverCredit: "Photo by ian dooley on Unsplash"
---

This blog is a static Astro site. Seven pages, four of them posts. Pushing one commit took about 12 minutes to reach production: the build alone ate more than four minutes, and the CI runner spent another minute and a half encoding images it had already encoded the day before. Two separate problems, and in both cases the slow part wasn't the work itself. Here's where the time actually went.

## Four minutes to build seven pages

I blamed the photos first. Every cover on this site is encoded to AVIF at build time, and AVIF encoders are slow. So I instrumented the build, ready to be right, and the "optimized images" phase came back at about 100 ms. The four minutes were going somewhere else entirely: the OG cards, those 1200×630 social preview images the build renders for each page with [satori](https://github.com/vercel/satori). Between 17 and 67 seconds per card.

## Every fast benchmark skipped the slow line

Then I lost an evening to plausible suspects. V8 cons-strings. The fonts array being reused across cards. Contention between sharp and libvips. A JIT deoptimization. Each one seemed to explain about 20 seconds, and each one came with a micro-benchmark that seemed to confirm it. That should have been the clue: every benchmark I wrote ran fast because every benchmark I wrote had moved the `html()` call outside the timed section.

Timing the two steps separately settled it in five minutes. satori itself: about 40 ms per card. All the rest was inside `html()`, the template parser from [satori-html](https://github.com/natemoo-re/satori-html), which behaves quadratically in the length of the markup string. And my markup was long, because I was inlining base64 data URIs straight into the `src` attributes. The topographic background alone weighs about 320 KB.

## Parse a small string, inject the big ones after

The fix fits in a few lines. Parse the markup with tiny placeholder tokens instead of the real URIs, so the string is about 2 KB and parses in a millisecond. Then walk the resulting tree and splice the actual data URIs onto the `<img>` nodes, since satori reads the tree directly and never sees the string again.

```ts
const TOPO_SRC = "@@topo@@";
const LOGO_SRC = "@@logo@@";
const COVER_SRC = "@@cover@@";

// The markup carries the tokens, so html() parses ~2 KB in ~1 ms.
const tree = html(markup);
injectImages(tree, {
  [TOPO_SRC]: topoDataUri, // the real ~320 KB string
  [LOGO_SRC]: logoDataUri,
  [COVER_SRC]: coverDataUri,
});
```

Cards went from 17-67 seconds to 100-200 ms each. The full build went from 4 m 11 s to 3.87 s.

I later found [an article about OG generation on Cloudflare Workers](https://dev.to/devoresyah/6-pitfalls-of-dynamic-og-image-generation-on-cloudflare-workers-satori-resvg-wasm-1kle) that hits the same wall ("Issue 3: satori-html Chokes on Large Data URLs") and lands on the same workaround, down to the placeholder token. One difference worth noting: for that author the parser produced broken output, while mine never broke anything. It got catastrophically slow instead. Same root cause, different symptom.

## Ninety seconds of encoding, thrown away every night

The second problem only existed in CI. Astro converts each photo into responsive variants at build time (AVIF for covers, WebP for galleries), and the deploy logs showed 90 seconds for 108 variants. On a blog with four posts. The cost is linear in the number of photos, so every future post would make deploys a little slower.

The per-variant numbers were no mystery: WebP comes out in 70 to 500 ms, AVIF in 1 to 26 seconds. That's the known price of files half the size. Two other things surprised me more.

First, each cover was encoded seven times. The home-page card asked for `widths={[400, 800, 1200]}`, the post page for `widths={[640, 1024, 1280, 1920]}`. Two disjoint lists for the same source image, so Astro's deduplication of identical transforms (same source, same width, same format) never had a chance to apply.

Second, Astro already caches the generated images and reuses them from one build to the next. Locally, a second build is near-instant. But a GitHub Actions runner is ephemeral: every deploy started from zero and re-encoded everything. The cache existed, it didn't survive the night.

## Make the cache outlive the runner

Two lines of configuration. Move the cache out of `node_modules` with [`cacheDir`](https://docs.astro.build/en/reference/configuration-reference/#cachedir) so it's easy to persist:

```js
// astro.config.mjs
cacheDir: "./.astro-cache",
```

Then persist that folder with [actions/cache](https://github.com/actions/cache), between install and build:

```yaml
- uses: actions/cache@27d5ce7f107fe9357f9df03efb73ab90386fccae # v5.0.5
  with:
    path: .astro-cache
    key: astro-assets-${{ hashFiles('pnpm-lock.yaml', 'src/assets/**') }}
    restore-keys: astro-assets-
```

Two details in that key earn their place. `pnpm-lock.yaml` is there so a bump of Astro or sharp re-encodes everything, rather than serving variants produced by an old encoder. And the `restore-keys` prefix means adding a photo only encodes that photo: yesterday's cache is restored, Astro encodes what's missing. Deploys become O(new images) instead of O(all images), which is exactly the property you want for a site that's supposed to grow.

One gotcha picked up along the way: caches created on a PR branch aren't readable from `main` (the reverse works). The first deploy after the merge still runs cold; it's the one that seeds the cache for all the others.

## Fewer variants, and the same ones everywhere

The cover widths now live in one shared module, and the card list is a subset of the post page's:

```ts
export const COVER_WIDTHS = [640, 1024, 1280, 1920];
export const CARD_COVER_WIDTHS = COVER_WIDTHS.slice(0, 3);
```

Same widths, same transforms, so deduplication finally applies: four AVIF encodings per cover instead of seven. The about-page gallery dropped from five widths to three while I was there; `[420, 800, 1280]` still covers a full-width phone at 2x and the desktop thumbnail. In total, 91 variants instead of 108, with no visible change in what the browser downloads.

## The numbers

| Build                 | Image step          |
| --------------------- | ------------------- |
| Before, cold          | ~90 s, 108 variants |
| After, cold           | 15.2 s, 91 variants |
| After, cache restored | **80 ms**           |

The cache weighs 15.3 MB, against the 10 GB that actions/cache allows per repository.

Neither fix made the slow work faster. Parsing a 2 KB string was always fast, and the AVIF encoder still takes its 26 seconds when it genuinely runs. One bug was a benchmark timing the wrong slice of code; the other was finished work thrown away with the runner. So: measure the step you're accusing, not the one next to it, and before optimizing a computation, check whether you're redoing it for nothing. I still wonder how many CI pipelines, right now, are re-encoding the same hundred images every single day.
