import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPool, dbQuery } from "@/lib/db";
import { compare } from "bcryptjs";
import crypto from "crypto";
import { headers } from "next/headers";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12, // 12 ชั่วโมง
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // ดึง user + role (จาก user_roles + roles)
        const [rows] = await dbQuery<any>(
          `
          SELECT
            u.user_id,
            u.username,
            u.password_hash,
            u.is_active,
            -- ให้ role มีค่า 'admin' ถ้ามี admin, ถ้าไม่มีก็ 'user'
            COALESCE(
              MAX(CASE WHEN r.role_name = 'admin' THEN 'admin' ELSE 'user' END),
              'user'
            ) AS role
          FROM users u
          LEFT JOIN user_roles ur ON ur.user_id = u.user_id
          LEFT JOIN roles r       ON r.role_id = ur.role_id
          WHERE u.username = ?
          GROUP BY u.user_id, u.username, u.password_hash, u.is_active
          LIMIT 1
        `,
          [credentials.username],
        );

        const user = rows[0];
        if (!user) return null;

        const ok = await compare(credentials.password, user.password_hash);
        if (!ok) return null;

        if (!user.is_active) {
          throw new Error("บัญชีถูกปิดใช้งาน");
        }

        return {
          id: user.user_id.toString(),
          name: user.username,
          role: user.role ?? "user", // admin หรือ user
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      const userId = Number(user.id);
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const deviceId = null; // ยังไม่ใช้ device จริง

      // ใช้ next/headers อ่าน header จาก request ปัจจุบัน
      const h = headers();
      const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? null;
      const userAgent = h.get("user-agent") ?? null;

      const pool = getPool();
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        // ปิด session เดิมทั้งหมดของ user นี้
        await conn.query(
          `
        UPDATE user_session
        SET is_active = 0,
            logout_at = NOW(),
            logout_reason = 'force_logout'
        WHERE user_id = ?
          AND is_active = 1
          AND logout_at IS NULL
      `,
          [userId],
        );

        // สร้าง session ใหม่
        const [result] = await conn.query(
          `
        INSERT INTO user_session (
          user_id,
          session_token,
          device_id,
          ip_address,
          user_agent,
          login_at,
          last_seen_at,
          is_active
        ) VALUES (
          ?, ?, ?, ?, ?, NOW(), NOW(), 1
        )
      `,
          [userId, sessionToken, deviceId, ip, userAgent],
        );

        const insertId = (result as any).insertId;

        (user as any).sessionId = insertId;
        (user as any).sessionToken = sessionToken;

        await conn.commit();
        return true;
      } catch (err) {
        await conn.rollback();
        console.error("signIn error:", err);
        return false;
      } finally {
        conn.release();
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.role = user.role ?? "user";
        // @ts-ignore
        if (user.sessionId) token.sessionId = user.sessionId;
        // @ts-ignore
        if (user.sessionToken) token.sessionToken = user.sessionToken;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore
        session.user.role = token.role;
        // @ts-ignore
        session.user.sessionId = token.sessionId;
        // @ts-ignore
        session.user.sessionToken = token.sessionToken;
      }
      return session;
    },
  },

  // ปิด user_session ตอน signOut
  events: {
    async signOut({ token }) {
      try {
        // @ts-ignore
        const sessionToken = token?.sessionToken;
        if (!sessionToken) return;

        await dbQuery(
          `
          UPDATE user_session
          SET is_active = 0,
              logout_at = NOW(),
              logout_reason = 'user_logout'
          WHERE session_token = ?
            AND is_active = 1
            AND logout_at IS NULL
        `,
          [sessionToken],
        );
      } catch (err) {
        console.error("signOut event error:", err);
      }
    },
  },

  secret: process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
