import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { NEXTAUTH_SECRET } from "@/config";

const AUTH_PATHS = ["/auth/login"];
const PROTECTED_ROOT = "/admin/dashboard";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  if (isAuthenticated) {
    // Si está autenticado y va a una ruta de autenticación, redirigir al dashboard
    if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL(PROTECTED_ROOT, req.url));
    }
    // Si está autenticado y va a la raíz, redirigir al dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL(PROTECTED_ROOT, req.url));
    }
  } else {
    // Si no está autenticado y va a una ruta protegida, redirigir al login
    // La raíz se considera protegida en este caso.
    const isPublic = AUTH_PATHS.some((p) => pathname.startsWith(p));
    if (!isPublic) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      if (pathname !== "/") {
        url.searchParams.set("callbackUrl", pathname);
      }
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico|assets).*)"],
};
