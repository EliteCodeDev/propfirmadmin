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
  email?: string | null;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
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
          const loginResponse = await login({
            email: credentials.email,
            password: credentials.password,
          });
          console.log("Login response completa:", loginResponse);

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
          console.log("Datos extraídos:", {
            user,
            access_token,
            refresh_token,
          });

          if (user && access_token) {
            // Normalizamos el usuario del backend (puede venir con userID, role, etc.)
            const rawUser = user;
            // Extraer el rol principal desde el backend
            const roleName: string | undefined = rawUser?.role?.name;
            // Bloquear acceso a usuarios sin rol o con rol 'user'
            if (!roleName || roleName === "user") {
              throw new Error("No tienes permisos para acceder al panel");
            }
            const userToReturn = {
              id: rawUser.userID ?? rawUser.id, // Mapear userID del backend a id que espera NextAuth
              name:
                rawUser.username ||
                `${rawUser.firstName || ""} ${rawUser.lastName || ""}`.trim() ||
                rawUser.email,
              email: rawUser.email ?? undefined,
              image: null, // No hay imagen en el backend
              // Campos personalizados
              username: rawUser.username,
              firstName: rawUser.firstName,
              lastName: rawUser.lastName,
              isVerified: rawUser.isVerified,
              // Mapear a arreglo de roles desde el rol único del backend
              roles:
                Array.isArray(rawUser?.userRoles) && rawUser?.userRoles.length
                  ? rawUser.userRoles
                  : roleName
                  ? [roleName]
                  : [],
              accessToken: access_token,
              refreshToken: refresh_token,
            } as User;
            console.log("Usuario que se retorna:", userToReturn);
            return userToReturn;
          }
          console.log(
            "No se pudo crear el usuario - falta user o access_token"
          );
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
      console.log("token", jwtToken);
      console.log("user callback", user);

      // Primer login - cuando user está presente
      if (user) {
        console.log("Usuario en primer login:", user);
        const u = user as User & {
          accessToken?: string;
          refreshToken?: string;
          id: string | number;
          username?: string;
          firstName?: string;
          lastName?: string;
          roles?: string[];
          isVerified?: boolean;
        };

        // Guardar todos los datos del usuario en el token
        jwtToken.accessToken = u.accessToken;
        jwtToken.refreshToken = u.refreshToken;
        jwtToken.id = u.id;
        jwtToken.email = (u.email ?? undefined) as string | undefined;
        jwtToken.name = (u.name ?? undefined) as string | undefined;
        jwtToken.username = u.username;
        jwtToken.firstName = u.firstName;
        jwtToken.lastName = u.lastName;
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

      // Requests subsecuentes - user es undefined, pero el token persiste los datos
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
      if (t.email) session.user.email = t.email;
      if (t.name) session.user.name = t.name;
      if (t.username) session.user.username = t.username;
      if (t.firstName) session.user.firstName = t.firstName;
      if (t.lastName) session.user.lastName = t.lastName;
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
