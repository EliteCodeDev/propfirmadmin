import NextAuth, { NextAuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { login, refresh } from "@/api/auth";
import { NEXTAUTH_SECRET } from "@/config";
import { isAxiosError } from "axios";

// Tiempo de margen para refrescar antes de expirar (segundos)
const REFRESH_THRESHOLD = 60; // 1 minuto

interface ExtendedJWT extends JWT {
  // 'id' es requerido en JWT extendido para evitar incompatibilidad, usar union con existente
  id: string | number; // NextAuth core espera id declarado en augmentations
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number; // epoch seconds
  roles?: string[];
  isVerified?: boolean;
}

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
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
          const { user, access_token, refresh_token } = await login({
            email: credentials.email,
            password: credentials.password,
          });
          if (user && access_token) {
            return {
              ...user,
              accessToken: access_token,
              refreshToken: refresh_token,
            } as User;
          }
          return null;
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
      const jwtToken = token as ExtendedJWT;

      // Primer login
      if (user) {
        const u = user as User & {
          accessToken?: string;
          refreshToken?: string;
          id: string | number;
          roles?: string[];
          isVerified?: boolean;
        };
        jwtToken.accessToken = u.accessToken;
        jwtToken.refreshToken = u.refreshToken;
        jwtToken.id = u.id;
        if (u.roles) jwtToken.roles = u.roles;
        if (typeof u.isVerified !== "undefined")
          jwtToken.isVerified = u.isVerified;
        // Decodificar expiración del access token (JWT estándar) para programar refresh
        if (u.accessToken) {
          try {
            const payload = JSON.parse(
              Buffer.from(u.accessToken.split(".")[1], "base64").toString()
            );
            jwtToken.accessTokenExpires = payload.exp; // en segundos
          } catch {}
        }
        return jwtToken;
      }

      // Refresh automático si está cerca de expirar
      if (jwtToken.accessToken && jwtToken.accessTokenExpires) {
        const now = Math.floor(Date.now() / 1000);
        const shouldRefresh =
          jwtToken.accessTokenExpires - now < REFRESH_THRESHOLD;
        if (shouldRefresh && jwtToken.refreshToken) {
          try {
            const data = await refresh(jwtToken.refreshToken);
            jwtToken.accessToken = data.access_token;
            jwtToken.refreshToken = data.refresh_token || jwtToken.refreshToken; // por si se rota
            try {
              const payload = JSON.parse(
                Buffer.from(
                  data.access_token.split(".")[1],
                  "base64"
                ).toString()
              );
              jwtToken.accessTokenExpires = payload.exp;
            } catch {}
          } catch {
            // Si falla refresh, limpiamos tokens para forzar signIn en el front
            delete jwtToken.accessToken;
            delete jwtToken.refreshToken;
            delete jwtToken.accessTokenExpires;
          }
        }
      }
      return jwtToken;
    },
    async session({ session, token }) {
      const t = token as ExtendedJWT;
      session.accessToken = t.accessToken;
      session.refreshToken = t.refreshToken;
      if (t.id !== undefined) session.user.id = t.id as string | number;
      if (t.roles) session.user.roles = t.roles;
      if (typeof t.isVerified !== "undefined")
        session.user.isVerified = t.isVerified;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 días (alineado con refresh token)
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7, // mismo periodo
  },
};

export const authHandler = NextAuth(authOptions);
