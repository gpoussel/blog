// Day-granular "is this post published yet?" predicate, shared by the Astro
// collection filter (src/utils/posts.ts) and the scheduled-deploy gate script
// (scripts/scheduled-deploy-gate.ts). It lives in its own module, away from
// astro:content imports, so the script can use it outside an Astro build.
//
// Timezone note (issue #16): posts use date-only frontmatter, which
// `z.coerce.date()` parses as UTC midnight. Comparing YYYY-MM-DD UTC stamps
// lexicographically keeps the schedule day-granular and immune to DST/local
// timezone off-by-one surprises.

/** UTC calendar date of a moment, as a sortable "YYYY-MM-DD" stamp. */
export function utcDateStamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** True once `pubDate`'s UTC calendar day is `todayStamp` or earlier. */
export function isPubDateReached(pubDate: Date, todayStamp: string): boolean {
  return utcDateStamp(pubDate) <= todayStamp;
}
