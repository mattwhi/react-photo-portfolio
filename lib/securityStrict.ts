import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/security";

export async function verifySessionStrict(token: string) {
  // JWT signature + exp/iat validation
  const payload = await verifySession(token);

  // DB read for invalidation + authoritative role
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, passwordChangedAt: true },
  });

  if (!user) throw new Error("User not found");

  // iat is seconds since epoch
  const iatMs = payload.iat * 1000;
  const pwdMs = user.passwordChangedAt.getTime();

  if (iatMs < pwdMs) {
    throw new Error("Session invalidated (password changed)");
  }

  return {
    ...payload,
    role: user.role, // keep role in sync with DB
  };
}
