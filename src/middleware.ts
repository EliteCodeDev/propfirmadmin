// middleware.ts
import NextAuth from "next-auth";
import authConfig, { AUTH_PATHS, PROTECTED_ROOT } from "@/config/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLogged = !!req.auth;
  const isAuthRoute = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLogged ? PROTECTED_ROOT : "/auth/login", req.nextUrl)
    );
  }
  if (isLogged && isAuthRoute) {
    return NextResponse.redirect(new URL(PROTECTED_ROOT, req.nextUrl));
  }
});
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
