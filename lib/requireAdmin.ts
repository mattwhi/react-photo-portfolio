// src/lib/requireAdmin.ts
import { cookies } from "next/headers";
import { verifySessionStrict } from "@/lib/securityStrict";

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin() {
  const token = (await cookies()).get("pp_session")?.value;
  if (!token) throw new AuthError(401, "Not authenticated");

  const session = await verifySessionStrict(token);
  if (session.role !== "admin") throw new AuthError(403, "Forbidden");

  return session;
}
