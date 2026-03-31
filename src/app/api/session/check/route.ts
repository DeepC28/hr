// src/app/api/session/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbQuery } from "@/lib/db";

// ถ้าโปรเจคคุณ default เป็น edge แล้วมีปัญหาเรื่อง mysql ให้ใช้ runtime เป็น node
// export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // ดึง JWT token จาก cookie (ใช้ secret เดียวกับ AUTH_SECRET / next-auth)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json(
      { ok: false, reason: "no-token" },
      { status: 401 },
    );
  }

  const sessionToken = (token as any).sessionToken as string | undefined;

  if (!sessionToken) {
    return NextResponse.json(
      { ok: false, reason: "no-session-token" },
      { status: 401 },
    );
  }

  try {
    const [rows] = await dbQuery<any>(
      `
      SELECT 1
      FROM user_session
      WHERE session_token = ?
        AND is_active = 1
        AND logout_at IS NULL
      LIMIT 1
    `,
      [sessionToken],
    );

    const active = Array.isArray(rows) && rows.length > 0;

    if (!active) {
      // ไม่พบ session active แล้ว (โดน force logout / signOut ที่อื่น)
      return NextResponse.json(
        { ok: false, reason: "inactive" },
        { status: 401 },
      );
    }

    // ยัง active อยู่ปกติ
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("session check error:", err);
    return NextResponse.json(
      { ok: false, reason: "error" },
      { status: 500 },
    );
  }
}
