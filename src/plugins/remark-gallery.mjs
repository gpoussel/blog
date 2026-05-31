import path from "node:path";

// Where bare gallery filenames resolve to, mirroring the `cover` convention
// (src/utils/cover.ts). Authors write `![alt](harbour.jpg)`; we rewrite it to a
// path relative to the post so astro:assets optimises it like any other
// in-content image.
const PHOTOS_DIR = "src/assets/photos";

/** Depth-first collect of every `image` node under `node`, in document order. */
function collectImages(node, acc) {
  if (!node || typeof node !== "object") return;
  if (node.type === "image") {
    acc.push(node);
    return;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectImages(child, acc);
  }
}

/** Depth-first walk applying `visitor` to every node. */
function walk(node, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, visitor);
  }
}

/**
 * remark plugin: turn a `:::gallery` container directive holding 1-4 Markdown
 * images into a grid of lightbox triggers.
 *
 *   :::gallery
 *   ![A harbour at dusk](harbour.jpg)
 *   ![Pink flower spike](flower.jpg)
 *   :::
 *
 * Output (before astro:assets rewrites the <img> src):
 *   <div class="gallery" data-count="2" data-lightbox role="group" aria-label="…">
 *     <button class="gallery__item" data-lightbox-item><img alt="…" …></button>
 *     …
 *   </div>
 *
 * Bare filenames are rewritten to a path relative to the post so Astro emits
 * responsive AVIF; explicit relative paths and http(s) URLs are left untouched.
 * Runs after remark-directive (which parses the `:::` syntax).
 */
export default function remarkGallery() {
  return (tree, file) => {
    const fileDir = file.path ? path.dirname(file.path) : file.cwd;
    const photosAbs = path.resolve(file.cwd ?? process.cwd(), PHOTOS_DIR);

    walk(tree, (node) => {
      if (node.type !== "containerDirective" || node.name !== "gallery") return;

      const images = [];
      collectImages(node, images);
      const count = images.length;

      if (count === 0) {
        file.message(
          "Empty :::gallery directive (no images found).",
          node,
          "remark-gallery:empty",
        );
        return;
      }
      if (count > 4) {
        file.message(
          `:::gallery holds ${count} images; the layout is designed for 1-4.`,
          node,
          "remark-gallery:too-many",
        );
      }

      for (const img of images) {
        const url = img.url ?? "";
        const isRemote = /^https?:\/\//.test(url);
        const hasPath = url.includes("/");
        if (!isRemote && !hasPath && url) {
          let rel = path
            .relative(fileDir, path.join(photosAbs, url))
            .split(path.sep)
            .join("/");
          if (!rel.startsWith(".")) rel = `./${rel}`;
          img.url = rel;
        }
      }

      const data = node.data ?? (node.data = {});
      data.hName = "div";
      data.hProperties = {
        className: ["gallery"],
        "data-count": String(count),
        "data-lightbox": "",
        role: "group",
        "aria-label": count === 1 ? "Image" : `Gallery of ${count} images`,
      };

      // Each image becomes a focusable button that opens the shared lightbox.
      // The button's accessible name comes from the image alt it contains.
      node.children = images.map((img) => ({
        type: "galleryItem",
        data: {
          hName: "button",
          hProperties: {
            type: "button",
            className: ["gallery__item"],
            "data-lightbox-item": "",
            "aria-haspopup": "dialog",
          },
        },
        children: [img],
      }));
    });
  };
}
