import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { postSchema } from "../src/schemas/post";

// Validates that every blog post's frontmatter ("header") matches the expected
// schema (src/schemas/post.ts). Run via `pnpm lint:content`. Exits non-zero on
// the first set of validation errors so CI fails loudly.

const BLOG_DIR = "src/content/blog";

function listMarkdown(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return []; // collection directory may not exist yet
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdown(full);
    return entry.isFile() && entry.name.endsWith(".md") ? [full] : [];
  });
}

const files = listMarkdown(BLOG_DIR);
let failures = 0;

for (const file of files) {
  const { data } = matter(readFileSync(file, "utf8"));
  const result = postSchema.safeParse(data);
  if (!result.success) {
    failures += 1;
    console.error(`✖ ${file}`);
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "(root)";
      console.error(`    ${path}: ${issue.message}`);
    }
  }
}

if (failures > 0) {
  console.error(`\nFrontmatter check failed for ${failures} file(s).`);
  process.exit(1);
}

console.log(`Frontmatter OK (${files.length} post(s) checked).`);
