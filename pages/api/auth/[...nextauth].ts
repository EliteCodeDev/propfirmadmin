import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { login } from '@/services/auth';
import { isAxiosError } from 'axios';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
  providers: [
    CredentialsProvider({
      name: 'Email y contraseña',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Please provide email and password');
        }

        try {
          // Call the login function from our new auth service
          const { user, accessToken } = await login({
            email: credentials.email,
            password: credentials.password,
          });

          if (user && accessToken) {
            // The user object returned from authorize will be passed to the jwt callback
            // We need to include the accessToken here to pass it along.
            return {
              ...user,
              accessToken,
            };
          }

          // Return null if user data could not be retrieved
          return null;

        } catch (err) {
          if (isAxiosError(err)) {
            // Extract error message from NestJS response
            const message = err.response?.data?.message || 'Invalid credentials';
            // Check for specific error cases, like unconfirmed email
            if (message.includes('confirm your email')) {
              throw new Error('Email not confirmed');
            }
            throw new Error(message);
          }
          // For any other error, throw a generic message
          throw new Error('An unexpected error occurred');
        }
      },
    }),
  ],

  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id; 
        token.roles = user.roles || [];
        token.isVerified = user.isVerified ?? false;
      }
      return token;
    },

    // This callback is called whenever a session is checked.
    async session({ session, token }) {
      // Pass info from the token to the session object
      if (token) {
        session.accessToken = token.accessToken as string;
        session.user.id = token.id as string | number;
        session.user.roles = token.roles as string[];
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
