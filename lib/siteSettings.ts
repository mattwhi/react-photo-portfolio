import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export type NavLink = { label: string; href: string };
export type SocialLinks = Partial<{
  instagram: string;
  tiktok: string;
  facebook: string;
  youtube: string;
  x: string;
  linkedin: string;
}>;

export async function getSiteSettings() {
  noStore();

  const s = await prisma.siteSettings.findUnique({ where: { id: "main" } });

  // Fallback if table is empty
  return (
    s ?? {
      id: "main",
      siteTitle: "Photo Portfolio",
      logoUrl: null,
      navLinks: [{ label: "Galleries", href: "/" }],
      socialLinks: {},
    }
  );
}
