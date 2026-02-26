// app/robots.ts
import type { MetadataRoute } from "next";
import { getSiteSettings, absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSiteSettings();

  // ✅ Ensure baseUrl is always a string
  const baseUrl =
    (s as any)?.siteUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const globalNoindex = Boolean((s as any)?.globalNoindex);

  if (globalNoindex) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: absoluteUrl(baseUrl, "/sitemap.xml"),
    };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin", "/api"] },
    ],
    sitemap: absoluteUrl(baseUrl, "/sitemap.xml"),
  };
}
