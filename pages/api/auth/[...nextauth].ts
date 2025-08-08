// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signIn as signInStrapi } from '@/services/auth';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Email y contraseña',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.warn('Authorize: faltan email o password');
          return null;
        }

        try {
          const { user, jwt } = await signInStrapi({
            email:    credentials.email,
            password: credentials.password,
          });

          // ✋ Aquí filtramos por rol
          const roleName = (user.role?.name || '').toLowerCase();
          if (roleName !== 'webmaster') {
            console.warn(`Authorize: acceso denegado, rol no autorizado (${user.role?.name})`);
            return null;
          }

          // Devolvemos los campos mínimos que NextAuth necesita
          return {
            id:    user.id,
            name:  user.username,
            email: user.email,
            jwt,
          };
        } catch (err) {
          console.error('Authorize error:', err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).jwt;
        token.id          = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id     = token.id as number;
      return session;
    },
  },
};

export default NextAuth(authOptions);
