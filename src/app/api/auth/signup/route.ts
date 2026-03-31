// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { dbQuery, getPool } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const runtime = "nodejs";

async function sendVerificationEmail(email: string, token: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"HR System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "ยืนยันอีเมลสำหรับการสมัครใช้งานระบบ HR",
    html: `
      <p>สวัสดีครับ</p>
      <p>คุณได้รับอีเมลนี้เพราะมีการสมัครสมาชิกด้วยอีเมลนี้ในระบบ HR ของเรา</p>
      <p>กรุณากดปุ่มด้านล่างเพื่อยืนยันอีเมล:</p>
      <p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:4px">
          ยืนยันอีเมล
        </a>
      </p>
      <p>หากคุณไม่ได้เป็นผู้ร้องขอ สามารถละเว้นอีเมลฉบับนี้ได้เลย</p>
    `,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "รูปแบบข้อมูลไม่ถูกต้อง (ต้องเป็น JSON)" },
        { status: 400 },
      );
    }

    const { username, email, password } = body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "กรุณากรอก username, email และ password ให้ครบถ้วน" },
        { status: 400 },
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { message: "username ต้องมีอย่างน้อย 3 ตัวอักษร" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    // เช็คว่ามี username หรือ email นี้แล้วหรือยัง
    const [existing] = await dbQuery<RowDataPacket[]>(
      "SELECT user_id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [username, email],
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "มี username หรือ email นี้ในระบบแล้ว" },
        { status: 400 },
      );
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // === 1) สร้าง user โดย is_active = 0 (ยังไม่ยืนยันอีเมล) ===
    const [insertResult] = await getPool().execute<ResultSetHeader>(
      `
      INSERT INTO users (username, email, password_hash, is_active)
      VALUES (?, ?, ?, 0)
      `,
      [username, email, passwordHash],
    );

    const userId = insertResult.insertId;

    // === 2) ผูก role ให้ user ทันที (role_id = 2 -> role "user") ===
    // ถ้า roles.id=2 ไม่มี จะ error foreign key ตรงนี้
    await getPool().execute(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES (?, 2)
      `,
      [userId],
    );

    // === 3) สร้าง token สำหรับยืนยันอีเมล ===
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ชม.

    await getPool().execute(
      `
      INSERT INTO email_verification_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
      `,
      [userId, token, expiresAt],
    );

    // === 4) ส่งเมลยืนยัน ===
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: "สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยัน" },
      { status: 201 },
    );
  } catch (err) {
    console.error("SignUp error:", err);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}
