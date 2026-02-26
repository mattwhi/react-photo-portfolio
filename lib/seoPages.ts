// src/lib/seoPages.ts
export const SEO_PAGES = [
  { id: "home", label: "Home", path: "/" },
  { id: "blog", label: "Blog index", path: "/blog" },
] as const;

export type SeoPageId = (typeof SEO_PAGES)[number]["id"];
