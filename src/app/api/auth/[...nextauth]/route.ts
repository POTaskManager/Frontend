import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const handler = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // Mocked auth: accept any password 'password'
        const isValid = credentials.password === 'password';
        if (!isValid) return null;
        // Basic role mapping by email for demo
        const role = credentials.email.startsWith('admin')
          ? 'admin'
          : credentials.email.startsWith('manager')
          ? 'manager'
          : 'member';
        return { id: 'u_' + credentials.email, name: credentials.email, email: credentials.email, role } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      (session as any).user.role = token.role;
      return session;
    }
  }
});

export { handler as GET, handler as POST };


