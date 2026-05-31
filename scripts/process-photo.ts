/**
 * Photo pipeline for the blog.
 *
 * Takes raw phone photos and produces web-ready "master" images:
 *   1. gentle tone correction (ImageMagick -auto-level: stretches the tonal
 *      range without clipping, so it never blows out highlights)
 *   2. fix EXIF orientation, strip metadata
 *   3. downscale to a max long edge (never upscales)
 *
 * The master JPEG lands in src/assets/photos/. Astro's image pipeline
 * (astro:assets) then generates the responsive, heavily-compressed AVIF
 * derivatives at build time, so this script never touches the final web format.
 *
 * Usage:
 *   pnpm photo <file|dir> [more...] [--max <px>] [--out <slug>]
 *
 * Examples:
 *   pnpm photo "D:\\Photos\\IMG_4821.jpg"
 *   pnpm photo ./inbox --max 2400
 *   pnpm photo trip.jpg --out lofoten-sunrise
 *
 * Requires ImageMagick 7 on PATH (`magick`): winget install ImageMagick.ImageMagick
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const OUTPUT_DIR = join(PROJECT_ROOT, "src", "assets", "photos");
const SOURCE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
]);
const DEFAULT_MAX = 2000;
const QUALITY = 92;

interface Options {
  inputs: string[];
  max: number;
  out?: string;
}

function parseArgs(argv: string[]): Options {
  const inputs: string[] = [];
  let max = DEFAULT_MAX;
  let out: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--max") {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value <= 0) {
        fail(`--max expects a positive number, got "${argv[i]}"`);
      }
      max = value;
    } else if (arg === "--out") {
      out = argv[++i];
      if (!out) fail("--out expects a slug value");
    } else if (arg.startsWith("--")) {
      fail(`Unknown option: ${arg}`);
    } else {
      inputs.push(arg);
    }
  }

  if (inputs.length === 0) {
    fail(
      "No input file or directory given.\nUsage: pnpm photo <file|dir> [--max <px>] [--out <slug>]",
    );
  }
  return { inputs, max, out };
}

/** Slugify a filename stem into a safe, url-friendly asset name. */
function slugify(value: string): string {
  // normalize() splits accented letters into base + combining mark, which the
  // [^a-z0-9] pass below then drops, so "Café" -> "cafe" rather than "caf".
  return (
    value
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "photo"
  );
}

/** Expand inputs (files or directories) into a flat list of source image files. */
function collectFiles(inputs: string[]): string[] {
  const files: string[] = [];
  for (const input of inputs) {
    const abs = resolve(input);
    if (!existsSync(abs)) fail(`Input not found: ${input}`);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(abs)) {
        if (SOURCE_EXTENSIONS.has(extname(entry).toLowerCase())) {
          files.push(join(abs, entry));
        }
      }
    } else if (SOURCE_EXTENSIONS.has(extname(abs).toLowerCase())) {
      files.push(abs);
    } else {
      fail(`Unsupported file type: ${input}`);
    }
  }
  return files;
}

function processFile(file: string, slug: string, max: number): void {
  const outFile = join(OUTPUT_DIR, `${slug}.jpg`);
  const args = [
    file,
    "-auto-orient",
    "-strip",
    // Gentle tone correction only. `-auto-level` linearly stretches the tonal
    // range from the image's actual min/max, so it never clips: highlights stay
    // intact. We deliberately avoid `-auto-gamma` (pushes the mean toward the
    // midpoint, brightening already-bright photos into a blown-out look) and
    // `-normalize` (a contrast stretch that clips bright pixels to pure white).
    "-auto-level",
    "-resize",
    `${max}x${max}>`,
    "-quality",
    String(QUALITY),
    outFile,
  ];

  const result = spawnSync("magick", args, {
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (result.error) {
    if ((result.error as NodeJS.ErrnoException).code === "ENOENT") {
      fail(
        "ImageMagick (`magick`) was not found on PATH.\n" +
          "Install it with: winget install ImageMagick.ImageMagick\n" +
          "(then restart the terminal so PATH refreshes).",
      );
    }
    fail(`Failed to run magick: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`magick exited with code ${result.status} on ${basename(file)}`);
  }

  const sizeKb = Math.round(statSync(outFile).size / 1024);
  console.log(
    `  ${basename(file)}  ->  src/assets/photos/${slug}.jpg  (${sizeKb} KB master)`,
  );
}

function fail(message: string): never {
  console.error(`\nphoto: ${message}\n`);
  process.exit(1);
}

function main(): void {
  const { inputs, max, out } = parseArgs(process.argv.slice(2));
  const files = collectFiles(inputs);
  if (files.length === 0)
    fail("No supported image files found in the given input(s).");
  if (out && files.length > 1) {
    fail("--out can only be used with a single input file.");
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(
    `\nProcessing ${files.length} photo(s) (max ${max}px, quality ${QUALITY}):`,
  );

  const slugs: string[] = [];
  for (const file of files) {
    const slug = out ?? slugify(basename(file, extname(file)));
    processFile(file, slug, max);
    slugs.push(slug);
  }

  console.log("\nDone. Use in frontmatter / about:");
  for (const slug of slugs) {
    console.log(`  cover: "${slug}.jpg"`);
  }
  console.log("");
}

main();
