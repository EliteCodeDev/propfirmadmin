// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
    interface Session extends DefaultSession {
        accessToken?: string;
        user: DefaultSession['user'] & {
            id?: number;
            affiliateRef?: string;
            roleName?: string;
            isVerified?: boolean;
        };
    }
    interface User extends DefaultUser {
        jwt?: string;
        id?: number;
        affiliateRef?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT extends DefaultJWT {
        accessToken?: string;
        id?: number;
        affiliateRef?: string;
        roleName?: string;
        isVerified?: boolean;
    }
}
