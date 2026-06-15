---
title: "Why did my seven-page blog take 12 minutes to deploy?"
description: "My static Astro blog took 12 minutes to build and deploy. The culprits: satori-html parsing 320 KB data URIs quadratically, AVIF encodings thrown away with every CI runner, and an upload that re-sent unchanged files. Three fixes, a few lines each."
pubDate: 2026-06-09
categories: ["Web"]
cover: "astro-build-perf.jpg"
coverAlt: "A field of hot air balloons at dawn, a few already in the air, most still inflating on the ground."
coverCredit: "Photo by ian dooley on Unsplash"
---

This blog is a static Astro site. Seven pages, four of them posts. And pushing one commit took about 12 minutes to reach production. The time went to three places: a build dominated by OG card rendering, a CI runner re-encoding images it had encoded on the previous push, and an upload re-sending files the server already had. None of it was useful new work.

## Four minutes to build seven pages

I blamed the photos first. Every cover on this site is encoded to AVIF at build time, and AVIF encoders are slow. So I instrumented the build, ready to be right, and the "optimized images" phase came back at about 100 ms. The four minutes were going somewhere else entirely: the OG cards, those 1200×630 social preview images the build renders for each page with [satori](https://github.com/vercel/satori). Between 17 and 67 seconds per card.

## Every fast benchmark skipped the slow line

Then I lost an evening to plausible suspects. V8 cons-strings. The fonts array being reused across cards. Contention between sharp and libvips. A JIT deoptimization. Each seemed to explain about 20 seconds, and each came with a micro-benchmark confirming it. That should have been the clue: every benchmark I wrote ran fast because every benchmark I wrote had moved the `html()` call outside the timed section.

Timing the two steps separately settled it in five minutes. satori itself: about 40 ms per card. All the rest was inside `html()`, the template parser from [satori-html](https://github.com/natemoo-re/satori-html), which behaves quadratically in the length of the markup string. And my markup was long, because I was inlining base64 data URIs straight into the `src` attributes. The topographic background alone weighs about 320 KB.

## Parse a small string, inject the big ones after

The fix: parse the markup with tiny placeholder tokens, so the string is about 2 KB and parses in a millisecond, then splice the real data URIs onto the `<img>` nodes of the resulting tree, which satori reads directly.

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

Cards went from 17-67 seconds to 100-200 ms each. The full build went from 4 m 11 s to 3.87 s. I later found [an article about OG generation on Cloudflare Workers](https://dev.to/devoresyah/6-pitfalls-of-dynamic-og-image-generation-on-cloudflare-workers-satori-resvg-wasm-1kle) that hits the same wall ("Issue 3: satori-html Chokes on Large Data URLs") and lands on the same workaround, down to the placeholder token. For that author the parser broke outright; mine only got catastrophically slow. Same root cause, different symptom.

## Ninety seconds thrown away on every push

The second problem only existed in CI. Astro converts each photo into responsive variants at build time (AVIF for covers, WebP for galleries), and the deploy logs showed 90 seconds for 108 variants, on a blog with four posts. AVIF encoding is slow by nature, 1 to 26 seconds per variant against WebP's 70 to 500 ms; that's the known price of files half the size. Two other things surprised me more.

First, each cover was encoded seven times. The home-page card asked for `widths={[400, 800, 1200]}`, the post page for `widths={[640, 1024, 1280, 1920]}`: two disjoint lists for the same source image, so Astro's deduplication of identical transforms never had a chance to apply.

Second, Astro already caches the generated images and reuses them from one build to the next. Locally, a second build is near-instant. But a GitHub Actions runner is ephemeral: every push to `main` got a fresh machine and re-encoded everything. The cache existed, it died with the runner.

## Make the cache outlive the runner

Two lines of configuration. Move the cache out of `node_modules` with [`cacheDir`](https://docs.astro.build/en/reference/configuration-reference/#cachedir), then persist it with [actions/cache](https://github.com/actions/cache):

```yaml
- uses: actions/cache@27d5ce7f107fe9357f9df03efb73ab90386fccae # v5.0.5
  with:
    path: .astro-cache
    key: astro-assets-${{ hashFiles('pnpm-lock.yaml', 'src/assets/**') }}
    restore-keys: astro-assets-
```

Two details in that key earn their place. `pnpm-lock.yaml` is there so a bump of Astro or sharp re-encodes everything rather than serving variants from an old encoder. And the `restore-keys` prefix means adding a photo only encodes that photo. Deploys become O(new images) instead of O(all images), which is exactly the property you want for a site that's supposed to grow. One gotcha: caches created on a PR branch aren't readable from `main`, so the first deploy after the merge still runs cold; it's the one that seeds the cache for the rest.

I also moved the cover widths into one shared module, with the card list a subset of the post page's. Same widths, same transforms, so deduplication finally applies: four AVIF encodings per cover instead of seven, and 91 variants instead of 108, with no visible change in what the browser downloads.

The result: a cold build spends 15.2 seconds on images instead of 90, and a build with the cache restored spends 80 ms. The cache weighs 15.3 MB, against the 10 GB actions/cache allows per repository.

## The upload re-sent the whole site every time

The last slice wasn't compute at all. The deploy pushed `dist/` to the server with `lftp mirror`, which decides what to transfer by comparing size and modification time. But every deploy rebuilds `dist/` from scratch, so every file comes out with a fresh mtime, and lftp re-uploaded the entire site on every push: each AVIF, each font, each OG card, byte-for-byte identical to what the server already held.

The replacement is `rsync --checksum --delete-after` over the same SSH transport. `--checksum` decides what to send by hashing file contents, so the always-fresh timestamps stop mattering and only files that actually changed move. The trade-off is hashing every file on both ends each run, negligible at blog scale, and exactly the cost you want: comparing what's in the files instead of when they were written.

None of the three fixes made the slow work faster. Parsing 2 KB was always fast, the AVIF encoder still takes its 26 seconds when it genuinely runs, and the network still moves a new photo at the same speed. One bug was a benchmark timing the wrong slice of code; the other two were finished work redone because nothing remembered it was done. Measure the step you're accusing, and before optimizing a computation, check whether you're redoing it for nothing. I still wonder how many CI pipelines, right now, are re-encoding and re-uploading the same hundred images on every push.
