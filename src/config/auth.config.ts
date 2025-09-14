// src/auth.config.ts
import type { NextAuthConfig } from "next-auth";

// Rutas públicas y raíz del dashboard para tu CRM
export const AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
];
export const PROTECTED_ROOT = "/admin/dashboard";

// ⚠️ Edge-safe: no uses adapters ni librerías Node-only aquí.
const authConfig = {
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  },
  callbacks: {
    /**
     * Se ejecuta en el middleware para permitir/bloquear acceso.
     * Mantén la lógica ligera (Edge).
     */
    authorized: async ({ request, auth }) => {
      const { pathname } = new URL(request.url);
      const isAuthRoute = AUTH_PATHS.some((p) => pathname.startsWith(p));
      const isPublic = isAuthRoute || pathname.startsWith("/public");
      if (isPublic) return true;
      // El resto está protegido
      return !!auth;
    },
  },
  trustHost: true,
  providers: [], // mantener array vacío en config Edge
} satisfies NextAuthConfig;

export default authConfig;
