import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

function safeJsonParse(input: string, fallback: unknown) {
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
}

export async function GET() {
  await requireAdmin();
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "main" },
  });
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  await requireAdmin();

  const body = (await req.json().catch(() => null)) as any;
  const siteTitle = String(body?.siteTitle ?? "").trim();
  const logoUrl = String(body?.logoUrl ?? "").trim() || null;
  const logoAlt = String(body?.logoAlt ?? "").trim() || null;
  const logoTitle = String(body?.logoTitle ?? "").trim() || null;

  // Accept navLinks/socialLinks as either objects or JSON strings
  const navLinks =
    typeof body?.navLinks === "string"
      ? safeJsonParse(body.navLinks, [])
      : body?.navLinks ?? [];

  const socialLinks =
    typeof body?.socialLinks === "string"
      ? safeJsonParse(body.socialLinks, {})
      : body?.socialLinks ?? {};

  if (!siteTitle) {
    return NextResponse.json(
      { error: "Site title is required" },
      { status: 400 }
    );
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "main" },
    update: { siteTitle, logoUrl, logoAlt, logoTitle, navLinks, socialLinks },
    create: {
      id: "main",
      siteTitle,
      logoUrl,
      logoAlt,
      logoTitle,
      navLinks,
      socialLinks,
    },
  });

  return NextResponse.json({ ok: true, settings });
}
