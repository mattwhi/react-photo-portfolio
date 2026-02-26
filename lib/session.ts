// lib/session.ts
import { cookies } from "next/headers";
import { verifySession } from "@/lib/security";

export async function getSession() {
  const cookieStore = await cookies(); // ✅ await in Next 15
  const token = cookieStore.get("pp_session")?.value;
  if (!token) return null;

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}
