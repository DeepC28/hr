import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      user_id?: number;
      role?: string;
      name?: string | null;
      email?: string | null;
    };
  }
}
