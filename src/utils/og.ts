import fs from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import { html } from "satori-html";
import sharp from "sharp";
import { SITE } from "../consts";
import { generateContours } from "./topo";

// Generated social-share images (Open Graph / Twitter). 1200x630 is the size
// every scraper expects. Rendered at build time: satori turns a flexbox tree
// into SVG (glyphs become vector paths, so no font is needed to rasterise),
// then sharp converts that SVG to PNG. See src/pages/og/[...route].png.ts.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface OgInput {
  /** Small label above the title (section name or post category). */
  eyebrow: string;
  /** The page title. */
  title: string;
  /** The page description / lede. */
  description: string;
  /** Blog cover: a local filename in src/assets/photos/ or an http(s) URL. */
  cover?: string;
  /** Site host shown in the footer (e.g. "gpoussel.fr"); omitted if empty. */
  host?: string;
}

// --- Brand palette (hex; satori does not parse the OKLCH tokens in global.css) ---
const SLATE_DEEP = "#15293a";
const SLATE = "#213c51";
const SLATE_LIFT = "#2d4d67";
const LIGHT = "#eef1f3";
const MUTED = "#9db2c0";
const MAUVE = "#ddaed3";
const STEEL = "#6e97b3";

const ACCENT_BAR = `linear-gradient(90deg, ${STEEL}, ${MAUVE} 55%, #c77fb0)`;

// The site mark from favicon.svg, recoloured in hex (the favicon uses oklch(),
// which librsvg/sharp can't parse) and given a lifted chip so it reads on slate.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${SLATE_LIFT}"/>
  <g fill="none" stroke-width="1.4">
    <path d="M16 16m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" stroke="${MAUVE}"/>
    <path d="M16 16m-7 0a7 5.5 0 1 0 14 0a7 5.5 0 1 0 -14 0" stroke="#eceff1" opacity="0.72"/>
    <path d="M16 16m-11 0a11 8.5 0 1 0 22 0a11 8.5 0 1 0 -22 0" stroke="${STEEL}" opacity="0.5"/>
  </g>
</svg>`;

// Resolve a path under src/assets/. These files are read at build time only
// (the site output is static), so the project root via process.cwd() is the
// stable anchor — import.meta.url shifts when the endpoint is bundled.
const assetPath = (rel: string) =>
  path.join(process.cwd(), "src", "assets", rel);

// --- Fonts: static TTFs satori can read (the repo's @fontsource packages ship
// variable woff2, which satori does not support). Loaded once per build. ---
type FontStyle = "normal" | "italic";
interface SatoriFont {
  name: string;
  data: Buffer;
  weight: 400 | 600 | 700;
  style: FontStyle;
}

let fontsPromise: Promise<SatoriFont[]> | null = null;
function loadFonts(): Promise<SatoriFont[]> {
  fontsPromise ??= Promise.all(
    (
      [
        ["hanken-grotesk-400.ttf", "Hanken Grotesk", 400, "normal"],
        ["hanken-grotesk-600.ttf", "Hanken Grotesk", 600, "normal"],
        ["hanken-grotesk-700.ttf", "Hanken Grotesk", 700, "normal"],
        ["literata-400.ttf", "Literata", 400, "normal"],
        ["literata-400-italic.ttf", "Literata", 400, "italic"],
      ] as const
    ).map(async ([file, name, weight, style]) => ({
      name,
      weight,
      style,
      data: await fs.readFile(assetPath(`og-fonts/${file}`)),
    })),
  );
  return fontsPromise;
}

// The site's topographic motif, in dark tones, for cards that have no cover
// photo (home, about, ...). Rendered to a PNG once: it mirrors the live
// TopoBackground but baked onto the slate gradient with a soft edge fade, so
// the share image reads as "the site, dark mode" rather than a flat panel.
let topoPromise: Promise<string> | null = null;
function loadTopoBackground(): Promise<string> {
  topoPromise ??= (async () => {
    const paths = generateContours({
      width: OG_WIDTH,
      height: OG_HEIGHT,
      cell: 14,
      noiseScale: 360,
      warp: 0.16,
      octaves: 3,
      levels: 22,
      masterEvery: 6,
    });
    const lines = paths
      .map(
        (p) =>
          `<path d="${p.d}" fill="none" stroke="${p.master ? MAUVE : "#a9c6dc"}" stroke-opacity="${p.master ? 0.22 : 0.13}" stroke-width="${p.master ? 1.3 : 1}" stroke-linejoin="round" stroke-linecap="round"/>`,
      )
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${SLATE_DEEP}"/>
          <stop offset="56%" stop-color="${SLATE}"/>
          <stop offset="100%" stop-color="#2a4a63"/>
        </linearGradient>
        <radialGradient id="fade" cx="50%" cy="30%" r="80%">
          <stop offset="46%" stop-color="#fff"/>
          <stop offset="100%" stop-color="#000"/>
        </radialGradient>
        <mask id="fadeMask"><rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#fade)"/></mask>
      </defs>
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
      <g mask="url(#fadeMask)">${lines}</g>
    </svg>`;
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    return `data:image/png;base64,${buf.toString("base64")}`;
  })();
  return topoPromise;
}

// Logo rasterised once to a crisp PNG data URI (satori embeds raster images).
let logoPromise: Promise<string> | null = null;
function loadLogo(): Promise<string> {
  logoPromise ??= sharp(Buffer.from(LOGO_SVG), { density: 384 })
    .resize(176, 176)
    .png()
    .toBuffer()
    .then((buf) => `data:image/png;base64,${buf.toString("base64")}`);
  return logoPromise;
}

/** Load a cover (local file or remote URL) and return a cover-cropped data URI. */
async function loadCover(cover: string): Promise<string | null> {
  try {
    let input: Buffer;
    if (/^https?:\/\//.test(cover)) {
      const res = await fetch(cover);
      if (!res.ok) return null;
      input = Buffer.from(await res.arrayBuffer());
    } else {
      input = await fs.readFile(assetPath(`photos/${cover}`));
    }
    const out = await sharp(input)
      .resize(920, OG_HEIGHT, { fit: "cover", position: "centre" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const truncate = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;

// Image sources are injected AFTER parsing. satori-html's `html()` parser is
// ~O(n²) over the markup string, so embedding the large base64 data URIs (the
// topo background alone is ~320KB) directly in the `src` attributes made parsing
// a single card take 16-60s (satori itself stays ~40ms). We instead parse with
// tiny placeholder tokens (milliseconds) and splice the real data URIs onto the
// resulting <img> nodes, which satori reads directly.
const TOPO_SRC = "@@topo@@";
const LOGO_SRC = "@@logo@@";
const COVER_SRC = "@@cover@@";

type VNode = { type?: string; props?: { src?: string; children?: unknown } };

// Walk the parsed satori-html tree and replace placeholder `src` tokens with the
// real (large) data URIs. Mutates in place; returns the tree for convenience.
function injectImages(node: unknown, srcs: Record<string, string>): unknown {
  if (!node || typeof node !== "object") return node;
  const props = (node as VNode).props;
  if (props) {
    if (typeof props.src === "string" && props.src in srcs) {
      props.src = srcs[props.src];
    }
    const children = props.children;
    if (Array.isArray(children)) {
      for (const child of children) injectImages(child, srcs);
    } else {
      injectImages(children, srcs);
    }
  }
  return node;
}

function brandRow() {
  return `<div style="display:flex;align-items:center;gap:20px">
    <img src="${LOGO_SRC}" width="76" height="76" style="width:76px;height:76px;border-radius:16px" />
    <span style="font-family:'Hanken Grotesk';font-weight:700;font-size:34px;letter-spacing:-0.01em;color:${LIGHT}">${esc(SITE.title)}</span>
  </div>`;
}

function footerRow(host?: string) {
  if (!host) return `<div style="display:flex"></div>`;
  return `<div style="display:flex;align-items:center;color:${MUTED};font-family:'Hanken Grotesk';font-weight:600;font-size:24px;letter-spacing:0.01em">${esc(host)}</div>`;
}

function eyebrow(label: string) {
  return `<div style="display:flex;align-items:center;font-family:'Hanken Grotesk';font-weight:700;font-size:24px;letter-spacing:0.14em;text-transform:uppercase;color:${MAUVE}">${esc(truncate(label, 28))}</div>`;
}

function buildDefault(input: OgInput, logo: string, topo: string) {
  const title = esc(truncate(input.title, 80));
  const desc = esc(truncate(input.description, 180));
  const markup =
    html(`<div style="display:flex;flex-direction:column;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;background-color:${SLATE};position:relative">
    <img src="${TOPO_SRC}" width="${OG_WIDTH}" height="${OG_HEIGHT}" style="position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:${OG_HEIGHT}px" />
    <div style="display:flex;position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:10px;background-image:${ACCENT_BAR}"></div>
    <div style="display:flex;flex-direction:column;flex:1;padding:78px 84px;justify-content:space-between">
      ${brandRow()}
      <div style="display:flex;flex-direction:column">
        ${eyebrow(input.eyebrow)}
        <div style="display:flex;font-family:'Hanken Grotesk';font-weight:700;font-size:66px;line-height:1.07;letter-spacing:-0.025em;color:${LIGHT};margin-top:22px">${title}</div>
        <div style="display:flex;font-family:'Literata';font-size:31px;line-height:1.45;color:${MUTED};margin-top:26px;max-width:880px">${desc}</div>
      </div>
      ${footerRow(input.host)}
    </div>
  </div>`);
  return injectImages(markup, { [TOPO_SRC]: topo, [LOGO_SRC]: logo });
}

function buildWithCover(
  input: OgInput,
  logo: string,
  topo: string,
  cover: string,
) {
  const title = esc(truncate(input.title, 70));
  const desc = esc(truncate(input.description, 150));
  // DOM order is paint order in satori (z-index is unsupported): the topo
  // background sits at the back, then the cover panel and seam, then the top
  // accent bar on top. The topo shows behind the text and is hidden by the photo.
  const markup =
    html(`<div style="display:flex;flex-direction:row;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;background-color:${SLATE};position:relative">
    <img src="${TOPO_SRC}" width="${OG_WIDTH}" height="${OG_HEIGHT}" style="position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:${OG_HEIGHT}px" />
    <div style="display:flex;flex-direction:column;width:760px;padding:70px 64px;justify-content:space-between">
      ${brandRow()}
      <div style="display:flex;flex-direction:column">
        ${eyebrow(input.eyebrow)}
        <div style="display:flex;font-family:'Hanken Grotesk';font-weight:700;font-size:54px;line-height:1.08;letter-spacing:-0.025em;color:${LIGHT};margin-top:20px">${title}</div>
        <div style="display:flex;font-family:'Literata';font-style:italic;font-size:28px;line-height:1.45;color:${MUTED};margin-top:22px;max-width:600px">${desc}</div>
      </div>
      ${footerRow(input.host)}
    </div>
    <div style="display:flex;width:440px;height:${OG_HEIGHT}px;position:relative">
      <img src="${COVER_SRC}" width="440" height="${OG_HEIGHT}" style="width:440px;height:${OG_HEIGHT}px;object-fit:cover" />
      <div style="display:flex;position:absolute;top:0;left:0;width:6px;height:${OG_HEIGHT}px;background-image:linear-gradient(180deg, ${MAUVE}, #c77fb0)"></div>
    </div>
    <div style="display:flex;position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:10px;background-image:${ACCENT_BAR}"></div>
  </div>`);
  return injectImages(markup, {
    [TOPO_SRC]: topo,
    [LOGO_SRC]: logo,
    [COVER_SRC]: cover,
  });
}

/** Render a social-share PNG for one page. */
export async function renderOgImage(input: OgInput): Promise<Buffer> {
  const [fonts, logo, topo] = await Promise.all([
    loadFonts(),
    loadLogo(),
    loadTopoBackground(),
  ]);
  const cover = input.cover ? await loadCover(input.cover) : null;
  const markup = cover
    ? buildWithCover(input, logo, topo, cover)
    : buildDefault(input, logo, topo);

  const svg = await satori(markup, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
