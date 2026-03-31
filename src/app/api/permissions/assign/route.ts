// src/app/api/permissions/assign/route.ts
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool, dbQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

interface RoleRow extends RowDataPacket {
  role_id: number;
  is_system: number;
}

interface PermissionRow extends RowDataPacket {
  permission_id: number;
}

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
    if (
      !body ||
      typeof body.role_id !== "number" ||
      typeof body.permission_id !== "number" ||
      typeof body.assigned !== "boolean"
    ) {
      return NextResponse.json(
        { message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const roleId = body.role_id as number;
    const permId = body.permission_id as number;
    const assigned = body.assigned as boolean;

    // ตรวจสอบว่า role มีจริงไหม
    const [roleRows] = await dbQuery<RoleRow[]>(
      `
      SELECT role_id, is_system
      FROM roles
      WHERE role_id = ?
      LIMIT 1
      `,
      [roleId],
    );

    if (roleRows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบบทบาทที่เลือก" },
        { status: 404 },
      );
    }

    // (ตัวอย่าง) ถ้าอยากล็อคไม่ให้แก้ role ระบบ:
    // if (roleRows[0].is_system) {
    //   return NextResponse.json(
    //     { message: "ไม่อนุญาตให้แก้ไขสิทธิ์ของ System role" },
    //     { status: 403 },
    //   );
    // }

    // ตรวจสอบว่า permission มีจริงไหม
    const [permRows] = await dbQuery<PermissionRow[]>(
      `
      SELECT permission_id
      FROM permissions
      WHERE permission_id = ?
      LIMIT 1
      `,
      [permId],
    );

    if (permRows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบสิทธิ์ที่เลือก" },
        { status: 404 },
      );
    }

    if (assigned) {
      // ให้สิทธิ์: INSERT IGNORE
      const [result] = await getPool().execute<ResultSetHeader>(
        `
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
        `,
        [roleId, permId],
      );

      return NextResponse.json(
        {
          message: "ให้สิทธิ์กับบทบาทเรียบร้อยแล้ว",
          assigned: true,
          affectedRows: result.affectedRows,
        },
        { status: 200 },
      );
    } else {
      // เอาสิทธิ์ออก: DELETE
      const [result] = await getPool().execute<ResultSetHeader>(
        `
        DELETE FROM role_permissions
        WHERE role_id = ? AND permission_id = ?
        `,
        [roleId, permId],
      );

      if (result.affectedRows === 0) {
        // ไม่มี record อยู่แล้ว แต่ถือว่า state ปลายทางคือ unassigned อยู่ดี
        return NextResponse.json(
          {
            message: "สิทธินี้ไม่ได้ถูกกำหนดให้กับบทบาทนี้อยู่แล้ว",
            assigned: false,
            affectedRows: 0,
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        {
          message: "ยกเลิกสิทธิ์จากบทบาทเรียบร้อยแล้ว",
          assigned: false,
          affectedRows: result.affectedRows,
        },
        { status: 200 },
      );
    }
  } catch (err: any) {
    console.error("Permissions assign POST error:", err);
    return NextResponse.json(
      {
        message:
          err?.message ||
          "ไม่สามารถอัปเดตสิทธิ์ให้บทบาทได้ (เกิดข้อผิดพลาดภายในระบบ)",
      },
      { status: 500 },
    );
  }
}
