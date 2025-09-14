// src/auth.ts
import NextAuth, { type NextAuthConfig, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/config/auth.config";

import { login, refresh } from "@/api/auth";
import { NEXTAUTH_SECRET } from "@/config";
import { isAxiosError } from "axios";
import { LoginCredentials } from "@/types";

// =====================
// Helpers Edge-safe
// =====================
const REFRESH_THRESHOLD = 60; // segundos

function decodeJwtExp(jwt: string): number | undefined {
  try {
    const [, payloadB64] = jwt.split(".");
    if (!payloadB64) return;
    const pad = payloadB64.length % 4 ? 4 - (payloadB64.length % 4) : 0;
    const b64 =
      payloadB64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
    const json =
      typeof atob === "function"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("binary");
    const payload = JSON.parse(json);
    return typeof payload.exp === "number" ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

// =====================
// NextAuth v5 principal
// =====================
const nextAuth = NextAuth({
  ...authConfig, // páginas, session, callbacks.authorized
  secret: NEXTAUTH_SECRET,
  // Proveedores (se ejecutan en Node, no en el middleware)
  providers: [
    Credentials({
      id: "credentials",
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Please provide email and password");
        }
        try {
          const loginResponse = await login({
            email: credentials.email,
            password: credentials.password,
          } as LoginCredentials);

          const { user, access_token, refresh_token } = loginResponse as {
            user: {
              userID?: string | number;
              id?: string | number;
              email?: string;
              username?: string;
              firstName?: string;
              lastName?: string;
              isVerified?: boolean;
              role?: { name?: string } | null;
              userRoles?: string[];
            } | null;
            access_token?: string;
            refresh_token?: string;
          };

          if (!user || !access_token) return null;

          // Bloquear usuarios sin rol o con rol 'user'
          const roleName: string | undefined = user?.role?.name;
          if (!roleName || roleName === "user") {
            throw new Error("No tienes permisos para acceder al panel");
          }

          const normalized: User = {
            id: String(user.userID ?? user.id ?? ""),
            name:
              user.username ||
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.email,
            email: user.email ?? undefined,
            image: null,
            // custom fields para callbacks
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified,
            roles:
              Array.isArray(user?.userRoles) && user.userRoles.length
                ? user.userRoles
                : roleName
                ? [roleName]
                : [],
            accessToken: access_token,
            refreshToken: refresh_token,
          };

          return normalized;
        } catch (err) {
          if (isAxiosError(err)) {
            const data = err.response?.data as
              | { message?: string | string[] }
              | undefined;
            const message = data?.message || "Invalid credentials";
            if (
              typeof message === "string" &&
              message.toLowerCase().includes("confirm your email")
            ) {
              throw new Error("Email not confirmed");
            }
            throw new Error(Array.isArray(message) ? message[0] : message);
          }
          throw new Error("An unexpected error occurred");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Primer login
      if (user) {
        const u = user as User & {
          accessToken?: string;
          refreshToken?: string;
          id?: string | number;
          username?: string;
          firstName?: string;
          lastName?: string;
          roles?: string[];
          isVerified?: boolean;
        };

        token.id = u.id;
        token.email = u.email ?? undefined;
        token.name = u.name ?? undefined;
        token.username = u.username;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.roles = u.roles;
        token.isVerified = u.isVerified;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        if (u.accessToken)
          token.accessTokenExpires = decodeJwtExp(u.accessToken);
        return token;
      }

      // Subsecuentes: auto-refresh
      if (token.accessToken && token.accessTokenExpires) {
        const now = Math.floor(Date.now() / 1000);
        const shouldRefresh =
          token.accessTokenExpires - now < REFRESH_THRESHOLD;

        if (shouldRefresh && token.refreshToken) {
          try {
            const data = await refresh(token.refreshToken);
            token.accessToken = data.access_token;
            token.refreshToken = data.refresh_token || token.refreshToken;
            token.accessTokenExpires = decodeJwtExp(data.access_token);
          } catch {
            // fuerza re-login cliente
            delete token.accessToken;
            delete token.refreshToken;
            delete token.accessTokenExpires;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.user = {
        ...(session.user ?? {}),
        id: token.id as string | number | undefined,
        email: token.email ?? null,
        name: token.name ?? null,
        username: token.username ?? null,
        firstName: token.firstName ?? null,
        lastName: token.lastName ?? null,
        roles: token.roles,
        isVerified: token.isVerified,
        image: session.user?.image ?? null,
      } as typeof session.user;
      return session;
    },
  },
});

export const { handlers, auth, signIn, signOut } = nextAuth;
export const { GET, POST } = handlers;
