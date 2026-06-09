import type { ImageMetadata } from "astro";

// Local processed photos live in src/assets/photos/ (produced by `pnpm photo`).
// import.meta.glob lets us map a frontmatter string like "lofoten.jpg" back to
// the imported ImageMetadata that astro:assets needs to emit responsive AVIF.
const localPhotos = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/photos/*.{jpg,jpeg,png,webp}",
);

export type ResolvedCover = { local: ImageMetadata } | { remote: string };

// Responsive widths for cover renderings, shared so the post page and the
// home-page cards request overlapping variants: astro:assets deduplicates
// identical (source, width, format) transforms, so keeping the card list a
// subset of the post list means each cover is encoded 4 times, not 7.
// AVIF encoding dominates build time, so don't add widths casually.
export const COVER_WIDTHS = [640, 1024, 1280, 1920];
export const CARD_COVER_WIDTHS = COVER_WIDTHS.slice(0, 3);

/**
 * Resolve a `cover` string to either a local image (optimised by astro:assets)
 * or a remote URL (rendered as a plain <img>, e.g. Unsplash stock photos).
 *
 * A value starting with http(s):// is treated as remote; anything else is a
 * filename under src/assets/photos/. Throws if a local path has no match so the
 * build fails loudly instead of shipping a broken image.
 */
export async function resolveCover(cover: string): Promise<ResolvedCover> {
  if (/^https?:\/\//.test(cover)) {
    return { remote: cover };
  }
  const key = `/src/assets/photos/${cover}`;
  const loader = localPhotos[key];
  if (!loader) {
    throw new Error(
      `Cover photo "${cover}" not found in src/assets/photos/. ` +
        `Run \`pnpm photo <file>\` to generate it, or use a full http(s) URL.`,
    );
  }
  return { local: (await loader()).default };
}
