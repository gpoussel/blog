// Central blog configuration. Edit these values to customize the site.

export const SITE = {
  title: "Guillaume Poussel",
  tagline: "On technology and the road less traveled",
  description:
    "A personal notebook: measured reflections on technology, artificial intelligence, and travel.",
  author: "Guillaume Poussel",
  lang: "en",
} as const;

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
