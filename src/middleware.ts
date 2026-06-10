import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const email = await verifySessionToken(token);
  const isLogin = req.nextUrl.pathname === "/login";

  if (!email && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search =
      req.nextUrl.pathname !== "/"
        ? `?next=${encodeURIComponent(req.nextUrl.pathname)}`
        : "";
    return NextResponse.redirect(url);
  }

  if (email && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect all pages; leave API routes and static assets untouched.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
