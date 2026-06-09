import { SITE } from "../consts";
import type { Category } from "./posts";

// Title/description for the static (non-blog) pages, kept here so the page
// itself (passed to BaseLayout) and its generated OG image stay in sync.
export const ABOUT_TITLE = "About: software architect and writer";
export const ABOUT_DESCRIPTION = `Who's behind the blog: ${SITE.title}, a software architect and full-stack developer writing measured, unhurried notes on technology, AI, and travel.`;

// The home hero lede, shared by the home page and the home OG card.
export const HOME_LEDE =
  "Long pieces, in no hurry, written to understand rather than to conclude.";

// Category-page meta, shared by the page and its generated OG card.
export function postCountLabel(count: number): string {
  return `${count} post${count === 1 ? "" : "s"}`;
}

export function categoryDescription(category: Category): string {
  return `Everything filed under ${category.name}: ${postCountLabel(category.count)}.`;
}
