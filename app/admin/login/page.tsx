// app/admin/login/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import { verifySessionStrict } from "@/lib/securityStrict";

export const runtime = "nodejs";

type SearchParams = {
  next?: string | string[];
};

function pickNext(sp: SearchParams | undefined) {
  const raw = Array.isArray(sp?.next) ? sp?.next[0] : sp?.next;
  // only allow returning to admin routes
  if (typeof raw === "string" && raw.startsWith("/admin")) return raw;
  return "/admin";
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const next = pickNext(sp);

  const token = (await cookies()).get("pp_session")?.value;

  if (token) {
    try {
      const session = await verifySessionStrict(token);

      // already logged in as admin -> go where you intended
      if (session.role === "admin") {
        redirect(next);
      }

      // logged in but not admin -> keep them out of admin
      redirect("/");
    } catch {
      // invalid/expired token: show login form
    }
  }

  return <AdminLoginForm nextUrl={next} />;
}
