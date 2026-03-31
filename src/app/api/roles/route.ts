// src/app/api/roles/route.ts
import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { dbQuery, getPool } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

interface RoleRow extends RowDataPacket {
  role_id: number;
  role_name: string;
  description: string | null;
}

// GET /api/roles -> ดึงรายการบทบาททั้งหมด
export async function GET() {
  try {
    const [rows] = await dbQuery<RoleRow[]>(
      `
      SELECT
        role_id,
        role_name,
        description
      FROM roles
      ORDER BY role_id ASC
      `,
      [],
    );

    const roles = rows.map((r) => ({
      role_id: r.role_id,
      role_name: r.role_name,
      description: r.description,
    }));

    return NextResponse.json({ roles }, { status: 200 });
  } catch (err) {
    console.error("HR Roles GET error:", err);
    return NextResponse.json(
      { message: "ไม่สามารถโหลดข้อมูล roles จากฐานข้อมูลได้" },
      { status: 500 },
    );
  }
}

// POST /api/roles -> เพิ่มบทบาทใหม่
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { message: "รูปแบบข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { role_name, description } = body as {
      role_name?: string;
      description?: string | null;
    };

    if (!role_name || role_name.trim() === "") {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อบทบาท" },
        { status: 400 },
      );
    }

    const [result] = await getPool().execute<ResultSetHeader>(
      `
      INSERT INTO roles (role_name, description)
      VALUES (?, ?)
      `,
      [role_name.trim(), description ?? null],
    );

    const newRole = {
      role_id: result.insertId,
      role_name: role_name.trim(),
      description: description ?? null,
    };

    return NextResponse.json(newRole, { status: 201 });
  } catch (err: any) {
    console.error("HR Roles POST error:", err);

    return NextResponse.json(
      {
        message:
          err?.message || "ไม่สามารถเพิ่มบทบาทใหม่ได้ (เกิดข้อผิดพลาดภายในระบบ)",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/roles -> ลบบทบาท (รับ role_id จาก body)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.role_id !== "number") {
      return NextResponse.json(
        { message: "ต้องระบุ role_id ให้ถูกต้อง" },
        { status: 400 },
      );
    }

    const roleId = body.role_id;

    const [result] = await getPool().execute<ResultSetHeader>(
      `
      DELETE FROM roles
      WHERE role_id = ?
      `,
      [roleId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "ไม่พบบทบาทที่ต้องการลบ" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "ลบบทบาทเรียบร้อยแล้ว" },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("HR Roles DELETE error:", err);
    return NextResponse.json(
      {
        message:
          err?.message ||
          "ไม่สามารถลบบทบาทได้ อาจมีการใช้งานอยู่หรือเกิดข้อผิดพลาดภายในระบบ",
      },
      { status: 500 },
    );
  }
}
