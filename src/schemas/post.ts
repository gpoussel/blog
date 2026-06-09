import { z } from "zod";

// Single source of truth for blog post frontmatter. Shared by the Astro content
// collection (src/content.config.ts) and the standalone frontmatter linter
// (scripts/check-frontmatter.ts) so the "expected header" is defined in one place.
export const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  // One or more free-form category names. Normalization (trim, case-insensitive
  // identity via slug) happens on read in src/utils/posts.ts.
  categories: z.array(z.string()).min(1),
  // Cover image: a stock-photo URL (Unsplash, etc.) or a local path.
  cover: z.string(),
  coverAlt: z.string().default(""),
  coverCredit: z.string().optional(),
  draft: z.boolean().default(false),
});

export type Post = z.infer<typeof postSchema>;
