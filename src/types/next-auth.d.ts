import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

// Extend the built-in types of NextAuth
declare module "next-auth" {
  /**
   * The shape of the user object returned in the session.
   * Extends the default session to include our custom properties.
   */
  interface Session extends DefaultSession {
    accessToken?: string; // access_token Nest
    refreshToken?: string; // refresh_token Nest
    user: DefaultSession["user"] & {
      id: string | number;
      username?: string;
      firstName?: string;
      lastName?: string;
      roles?: string[];
      isVerified?: boolean;
    };
  }

  /**
   * The shape of the user object returned from the `authorize` callback.
   * Extends the default user to include properties from our backend.
   */
  interface User extends DefaultUser {
    id: string | number;
    username?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
    isVerified?: boolean;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * The shape of the token that is stored in the JWT.
   * Extends the default JWT to include our custom properties.
   */
  interface JWT extends DefaultJWT {
    id: string | number;
    email?: string;
    name?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    accessToken?: string;
    refreshToken?: string;
    roles?: string[];
    isVerified?: boolean;
    accessTokenExpires?: number; // epoch seconds
  }
}
