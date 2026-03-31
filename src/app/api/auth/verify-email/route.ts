// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbQuery, getPool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      // ไม่มี token -> ส่งไปหน้า verified-email พร้อมสถานะ missing
      return NextResponse.redirect(`${appUrl}/verified-email?status=missing`);
    }

    const [rows] = await dbQuery<RowDataPacket[]>(
      `
      SELECT user_id, expires_at
      FROM email_verification_tokens
      WHERE token = ?
      LIMIT 1
      `,
      [token],
    );

    if (rows.length === 0) {
      // หา token ไม่เจอ
      return NextResponse.redirect(`${appUrl}/verified-email?status=invalid`);
    }

    const record = rows[0];

    const now = new Date();
    const expiresAt = new Date(record.expires_at as string);

    if (expiresAt < now) {
      // token หมดอายุ
      return NextResponse.redirect(`${appUrl}/verified-email?status=expired`);
    }

    const userId = record.user_id as number;

    // ตั้ง is_active = 1 เมื่อยืนยันอีเมลแล้ว
    await getPool().execute(
      `
      UPDATE users
      SET is_active = 1
      WHERE user_id = ?
      `,
      [userId],
    );

    // ลบ token ทิ้ง ใช้ได้ครั้งเดียว
    await getPool().execute(
      "DELETE FROM email_verification_tokens WHERE token = ?",
      [token],
    );

    // สำเร็จ -> ส่งไปหน้า verified-email พร้อมสถานะ success
    return NextResponse.redirect(`${appUrl}/verified-email?status=success`);
  } catch (err) {
    console.error("Verify email error:", err);
    // ถ้า error อื่น ๆ -> ส่งไปหน้า verified-email พร้อมสถานะ error
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/verified-email?status=error`);
  }
}
