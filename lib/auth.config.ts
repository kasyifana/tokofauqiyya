import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authConfig = {
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        loginType: { label: 'Login Type', type: 'text' },
      },
      async authorize(credentials) {
        const { username, password, loginType } = credentials as {
          username: string;
          password: string;
          loginType: string;
        };

        const adminUser = process.env.ADMIN_USERNAME ?? 'admin';
        const adminPass = process.env.ADMIN_PASSWORD ?? 'admin';
        const empUser = process.env.EMPLOYEE_USERNAME ?? 'karyawan';
        const empPass = process.env.EMPLOYEE_PASSWORD ?? 'karyawan';

        if (loginType === 'admin') {
          if (username === adminUser && password === adminPass) {
            return { id: '1', name: 'Admin', role: 'admin' };
          }
        } else if (loginType === 'employee') {
          if (username === empUser && password === empPass) {
            return { id: '2', name: 'Karyawan', role: 'employee' };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
} satisfies NextAuthConfig;
