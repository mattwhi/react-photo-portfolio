import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/token";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as any;
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();

  // Always return OK (avoid email enumeration)
  if (!email) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true },
  });

  if (user) {
    // Optional: delete old reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { email, type: "PASSWORD_RESET" },
    });

    const { token, tokenHash } = createToken();

    await prisma.verificationToken.create({
      data: {
        email,
        tokenHash,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const resetUrl =
      `${baseUrl}/reset-password?email=${encodeURIComponent(email)}` +
      `&token=${encodeURIComponent(token)}`;

    // ✅ Replace with real email sending (Resend/Postmark/SES/Nodemailer)
    console.log("PASSWORD RESET LINK:", resetUrl);
  }

  return NextResponse.json({ ok: true });
}
