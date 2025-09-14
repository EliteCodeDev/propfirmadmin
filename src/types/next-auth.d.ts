// src/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    refreshToken?: string;
    user: DefaultSession["user"] & {
      id?: string | number;
      email?: string | null;
      name?: string | null;
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      roles?: string[];
      isVerified?: boolean;
    };
  }

  interface User extends DefaultUser {
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    roles?: string[];
    isVerified?: boolean;
    // usados transitoriamente en jwt()
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string | number;
    email?: string;
    name?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
    isVerified?: boolean;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number; // epoch seconds
  }
}
