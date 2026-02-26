import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = new URL("/", req.url);
  const res = NextResponse.redirect(url);
  res.cookies.set("pp_session", "", { path: "/", maxAge: 0 });
  return res;
}
