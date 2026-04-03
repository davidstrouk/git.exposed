import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getRealDb } from '@repo/shared/db';
import { users, accounts, sessions, verificationTokens } from '@repo/shared/db/schema';

// Lazy adapter — defers DB connection until first auth call (not build time)
const lazyAdapter = new Proxy({} as ReturnType<typeof DrizzleAdapter>, {
  get(_, prop) {
    const real = DrizzleAdapter(getRealDb() as any, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    } as any);
    return (real as any)[prop];
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: lazyAdapter,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: { params: { scope: 'read:user user:email' } },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
});
