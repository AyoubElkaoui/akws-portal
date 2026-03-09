import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — always accessible
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/analytics/track") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/betaal/") ||
    pathname.startsWith("/boek/") ||
    pathname.startsWith("/review/") ||
    pathname.startsWith("/api/public/") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // NextAuth v5 uses "authjs.session-token" cookie and reads AUTH_SECRET from env
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    salt: "authjs.session-token",
    cookieName: "authjs.session-token",
  });

  // Not logged in — redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string | undefined;
  const tenantId = token.tenantId as string | undefined;

  // Admin routes — only for admins
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Dashboard routes — only for clients (admins can also access)
  if (pathname.startsWith("/dashboard")) {
    if (role === "CLIENT" && !tenantId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)"],
};
