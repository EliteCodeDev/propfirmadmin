import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { NEXTAUTH_SECRET } from "@/config";

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot-password"];
const PROTECTED_ROOT = "/admin/dashboard";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  if (isAuthenticated) {
    // Si entra a /auth/* redirigir al dashboard
    if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL(PROTECTED_ROOT, req.nextUrl.origin));
    }
    // Si entra a la raíz "/", redirigir siempre a /admin/dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL(PROTECTED_ROOT, req.nextUrl.origin));
    }
  } else {
    // Bloquear rutas protegidas (ej: /admin/*)
    const isPublic =
      AUTH_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";
    if (!isPublic) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("callbackUrl", pathname + search); // guarda path + query
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico|assets).*)"],
};
