import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: passwordHash,
      role: "admin",
      emailVerifiedAt: new Date(), // ✅ here
      passwordChangedAt: new Date(),
    },
    create: {
      email: adminEmail,
      password: passwordHash,
      role: "admin",
      emailVerifiedAt: new Date(), // ✅ and here
      passwordChangedAt: new Date(),
    },
  });

  const galleries = [
    {
      title: "Landscape",
      description: "Wide open spaces, big skies, and calm tones.",
    },
    { title: "Street", description: "Candid moments, motion, and texture." },
    { title: "Portrait", description: "People, light, and character." },
  ];

  for (const g of galleries) {
    const slug = slugify(g.title, { lower: true, strict: true });
    await prisma.gallery.upsert({
      where: { slug },
      update: { title: g.title, description: g.description },
      create: { title: g.title, description: g.description, slug },
    });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  const siteTitle = "Photo Portfolio";
  const siteName = "159 Photography"; // change this to your brand display name

  const navLinks = [
    { label: "Galleries", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "Admin", href: "/admin/galleries" },
  ];

  const socialLinks = {
    instagram: "",
    tiktok: "",
    facebook: "",
    youtube: "",
    x: "",
    linkedin: "",
  };

  await prisma.siteSettings.upsert({
    where: { id: "main" },
    update: {
      siteTitle,
      siteName,
      // Only keep this if your SiteSettings model includes siteUrl
      siteUrl,

      logoUrl: null,
      logoAlt: siteName,
      logoTitle: siteName,

      navLinks,
      socialLinks,

      titleTemplate: `%s | ${siteName}`,
      defaultDescription: "Photography portfolio and community.",
      defaultOgImageUrl: `${siteUrl}/og.png`,
      twitterHandle: "",
      globalNoindex: false,
    },
    create: {
      id: "main",
      siteTitle,
      siteName,
      // Only keep this if your SiteSettings model includes siteUrl
      siteUrl,

      logoUrl: null,
      logoAlt: siteName,
      logoTitle: siteName,

      navLinks,
      socialLinks,

      titleTemplate: `%s | ${siteName}`,
      defaultDescription: "Photography portfolio and community.",
      defaultOgImageUrl: `${siteUrl}/og.png`,
      twitterHandle: "",
      globalNoindex: false,
    },
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
