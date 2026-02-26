import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";

export const runtime = "nodejs";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: { email?: string; token?: string };
}) {
  const email = String(searchParams?.email ?? "")
    .trim()
    .toLowerCase();
  const token = String(searchParams?.token ?? "").trim();

  if (!email || !token) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="text-xl font-semibold">Invalid verification link</h1>
      </div>
    );
  }

  const tokenHash = hashToken(token);

  const record = await prisma.verificationToken.findFirst({
    where: {
      email,
      tokenHash,
      type: "EMAIL_VERIFY",
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="text-xl font-semibold">Link expired or invalid</h1>
        <p className="mt-2 text-sm opacity-80">
          Try registering again to get a new link.
        </p>
      </div>
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.delete({ where: { id: record.id } }),
  ]);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold">Email verified ✅</h1>
      <p className="mt-2 text-sm opacity-80">You can now log in.</p>
      <a className="mt-4 inline-block underline" href="/login">
        Go to login
      </a>
    </div>
  );
}
