// Central blog configuration. Edit these values to customize the site.

export const SITE = {
  title: "Guillaume Poussel",
  tagline: "On technology and the road less traveled",
  description:
    "A personal notebook by Guillaume Poussel: measured, unhurried reflections on technology, software architecture, AI, and the road less traveled.",
  author: "Guillaume Poussel",
  lang: "en",
} as const;

// GraphComment site id (public by nature: it ships in the HTML of every
// post that opts into comments). Threads are keyed by post slug.
export const GRAPHCOMMENT_ID = "gpoussel-blog";

export const NAV = [
  { label: "Writing", href: "/" },
  { label: "About", href: "/about" },
] as const;

export const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/guillaume-poussel-a745b1141/",
    icon: "simple-icons:linkedin",
  },
  {
    label: "GitHub",
    href: "https://github.com/gpoussel",
    icon: "simple-icons:github",
  },
  {
    label: "Bluesky",
    href: "https://bsky.app/profile/gpoussel.bsky.social",
    icon: "simple-icons:bluesky",
  },
] as const;
