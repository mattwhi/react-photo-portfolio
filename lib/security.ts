// lib/security.ts
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return encoder.encode(secret);
}

export type SessionPayload = { sub: string; role: string };
export type VerifiedSession = SessionPayload & { exp: number; iat: number };

export async function signSession(payload: SessionPayload) {
  const secret = getSecret();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<VerifiedSession> {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as VerifiedSession;
}
