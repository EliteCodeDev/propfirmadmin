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

  // 🟢 Caso especial: raíz "/"
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(PROTECTED_ROOT, req.nextUrl.origin));
    } else {
      return NextResponse.redirect(new URL("/auth/login", req.nextUrl.origin));
    }
  }

  if (isAuthenticated) {
    // Si entra a /auth/* lo mando al dashboard
    if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL(PROTECTED_ROOT, req.nextUrl.origin));
    }
  } else {
    // Bloquear cualquier ruta que no sea pública
    const isPublic = AUTH_PATHS.some((p) => pathname.startsWith(p));
    if (!isPublic) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("callbackUrl", pathname + search); // guarda la ruta original
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico|assets).*)"],
};
