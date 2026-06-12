import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import matter from "gray-matter";
import { postSchema } from "../src/schemas/post";
import { isPubDateReached, utcDateStamp } from "../src/utils/publication";

// Cheap gate in front of the expensive build+deploy (issue #16). Given the
// commit and start time of the last successful run of the Deploy workflow, it
// answers one question: did the set of published post slugs change since then?
// "Published" matches getPublishedPosts() exactly: not a draft, and pubDate's
// UTC day has been reached (shared predicate in src/utils/publication.ts).
//
// Usage: tsx scripts/scheduled-deploy-gate.ts --base-sha <sha> --base-time <ISO>
//
// Reads post files straight from git objects (`git ls-tree` + `git show`), so
// it needs the base sha in history (fetch-depth: 0 in CI) but no Astro build.
// Writes `deploy=true|false` to $GITHUB_OUTPUT when set; always prints the
// verdict. A frontmatter that no longer parses is skipped with a warning,
// which can only widen the diff, i.e. fail toward deploying.

const BLOG_DIR = "src/content/blog";

function arg(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value) {
    console.error(
      "Usage: tsx scripts/scheduled-deploy-gate.ts --base-sha <sha> --base-time <ISO date>",
    );
    process.exit(2);
  }
  return value;
}

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" });
}

/** Slugs of posts that are live in a build of `sha` done on `dayStamp` (UTC). */
function publishedSlugsAt(sha: string, dayStamp: string): Set<string> {
  const files = git("ls-tree", "-r", "--name-only", sha, "--", BLOG_DIR)
    .split("\n")
    .filter((file) => file.endsWith(".md"));
  const slugs = new Set<string>();
  for (const file of files) {
    const { data } = matter(git("show", `${sha}:${file}`));
    const parsed = postSchema.safeParse(data);
    if (!parsed.success) {
      console.warn(
        `! ${sha.slice(0, 7)}:${file} has invalid frontmatter, skipping`,
      );
      continue;
    }
    if (parsed.data.draft) continue;
    if (!isPubDateReached(parsed.data.pubDate, dayStamp)) continue;
    slugs.add(file.slice(BLOG_DIR.length + 1).replace(/\.md$/, ""));
  }
  return slugs;
}

const baseSha = arg("--base-sha");
const baseTime = new Date(arg("--base-time"));
if (Number.isNaN(baseTime.valueOf())) {
  console.error(`--base-time is not a parseable date`);
  process.exit(2);
}

const baseDay = utcDateStamp(baseTime);
const today = utcDateStamp(new Date());
const baseSlugs = publishedSlugsAt(baseSha, baseDay);
const headSlugs = publishedSlugsAt("HEAD", today);

const appeared = [...headSlugs].filter((slug) => !baseSlugs.has(slug)).sort();
const gone = [...baseSlugs].filter((slug) => !headSlugs.has(slug)).sort();
const deploy = appeared.length > 0 || gone.length > 0;

console.log(
  `Base: ${baseSlugs.size} published slug(s) at ${baseSha.slice(0, 7)} on ${baseDay}`,
);
console.log(`Head: ${headSlugs.size} published slug(s) at HEAD on ${today}`);
for (const slug of appeared) console.log(`  + ${slug}`);
for (const slug of gone) console.log(`  - ${slug}`);
console.log(
  deploy
    ? "Published set changed: deploy."
    : "Published set unchanged: skip deploy.",
);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `deploy=${deploy}\n`);
}
