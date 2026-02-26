// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/security";

const LOGIN_PATH = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Stamp the current admin path into a header for server components/layouts
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-admin-path", `${pathname}${search}`);

  // Allow the login page through (no auth check)
  if (pathname === LOGIN_PATH) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = req.cookies.get("pp_session")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  try {
    const session = await verifySession(token);

    // RBAC: only admins allowed into /admin
    if (session.role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("next", `${pathname}${search}`);

    const res = NextResponse.redirect(url);
    // optional: clear bad cookie to stop repeated failures
    res.cookies.set("pp_session", "", { path: "/", maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
