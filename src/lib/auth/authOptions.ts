import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByUsername } from "@/lib/auth/getUserWithRole";
import { verifyPassword } from "@/lib/auth/password";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    // เอาแบบอยู่ยาว ๆ (ปรับได้)
    maxAge: 60 * 60 * 24 * 365, // 1 ปี
    updateAge: 60 * 60 * 24 * 7, // refresh ทุก 7 วัน
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        const u = await getUserByUsername(username);
        if (!u || u.is_active !== 1) return null;

        const ok = await verifyPassword(password, u.password_hash);
        if (!ok) return null;

        return {
          id: String(u.user_id),
          name: u.username,
          email: u.email ?? undefined,
          role: u.primary_role,
          roles: u.roles,
          personId: u.person_id,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.role = (user as any).role;
        token.roles = (user as any).roles;
        token.personId = (user as any).personId;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.userId;
      (session.user as any).role = token.role;
      (session.user as any).roles = token.roles;
      (session.user as any).personId = token.personId;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};