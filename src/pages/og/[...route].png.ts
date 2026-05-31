import type { APIRoute } from "astro";
import { SITE } from "../../consts";
import { getPublishedPosts } from "../../utils/posts";
import {
  ABOUT_TITLE,
  ABOUT_DESCRIPTION,
  HOME_LEDE,
} from "../../utils/page-meta";
import { renderOgImage, type OgInput } from "../../utils/og";

// Build-time social-share images. One PNG per page is emitted under /og/:
//   /og/home.png, /og/about.png, /og/blog/<slug>.png
// BaseLayout points each page's og:image / twitter:image at its matching file.
// In `astro dev` these render on request; in `astro build` they are prebuilt.

// astro.config sets `site`; Astro exposes it here. Fall back gracefully if
// it is missing or still the placeholder.
const SITE_HOST = (() => {
  try {
    return new URL(import.meta.env.SITE ?? "").host;
  } catch {
    return undefined;
  }
})();

export async function getStaticPaths() {
  const host = SITE_HOST;
  const posts = await getPublishedPosts();

  const pages: { route: string; input: OgInput }[] = [
    {
      // The brand row already carries the name, so the home card uses the
      // tagline + lede (neither repeats it) for the title and description.
      route: "home",
      input: {
        eyebrow: "Writing",
        title: SITE.tagline,
        description: HOME_LEDE,
        host,
      },
    },
    {
      route: "about",
      input: {
        eyebrow: "About",
        title: ABOUT_TITLE,
        description: ABOUT_DESCRIPTION,
        host,
      },
    },
    ...posts.map((post) => ({
      route: `blog/${post.id}`,
      input: {
        eyebrow: post.data.category,
        title: post.data.title,
        description: post.data.description,
        cover: post.data.cover,
        host,
      } satisfies OgInput,
    })),
  ];

  return pages.map(({ route, input }) => ({
    params: { route },
    props: { input },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props.input as OgInput);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
