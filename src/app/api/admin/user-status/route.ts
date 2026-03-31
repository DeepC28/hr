// src/app/api/admin/user-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

type UserStatusAction = "suspend" | "activate" | "delete";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json().catch(() => null);
  } catch {
    return NextResponse.json(
      { message: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const userIdRaw = body?.user_id;
  const action = body?.action as UserStatusAction | undefined;

  const user_id =
    typeof userIdRaw === "string" ? Number(userIdRaw) : (userIdRaw as number);

  if (!user_id || Number.isNaN(user_id) || !action) {
    return NextResponse.json(
      { message: "ต้องระบุทั้ง user_id (ตัวเลข) และ action" },
      { status: 400 },
    );
  }

  if (!["suspend", "activate", "delete"].includes(action)) {
    return NextResponse.json(
      {
        message:
          "action ไม่ถูกต้อง (ต้องเป็น 'suspend', 'activate' หรือ 'delete')",
      },
      { status: 400 },
    );
  }

  const pool = getPool();

  try {
    // ===== ระงับบัญชี: แค่เปลี่ยน is_active = 0 =====
    if (action === "suspend") {
      await pool.execute(
        "UPDATE users SET is_active = 0 WHERE user_id = ?",
        [user_id],
      );

      return NextResponse.json({
        message: "ระงับบัญชีผู้ใช้เรียบร้อยแล้ว",
      });
    }

    // ===== เปิดใช้งานบัญชี: is_active = 1 =====
    if (action === "activate") {
      await pool.execute(
        "UPDATE users SET is_active = 1 WHERE user_id = ?",
        [user_id],
      );

      return NextResponse.json({
        message: "เปิดใช้งานบัญชีผู้ใช้เรียบร้อยแล้ว",
      });
    }

    // ===== ลบบัญชี: ลบ user + ข้อมูลที่ผูกทั้งหมด =====
    if (action === "delete") {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // เอา person_id ก่อน เผื่อมีผูกกับ person
        const [rows] = await conn.query(
          "SELECT person_id FROM users WHERE user_id = ?",
          [user_id],
        );
        const userRows = rows as { person_id: number | null }[];

        if (userRows.length === 0) {
          await conn.rollback();
          conn.release();
          return NextResponse.json(
            { message: "ไม่พบผู้ใช้ที่ต้องการลบ" },
            { status: 404 },
          );
        }

        const person_id = userRows[0].person_id;

        // 1) ลบ custom fields ที่ผูกกับ user นี้ (entity_type = 'user')
        await conn.execute(
          `DELETE FROM custom_field_values
           WHERE entity_type = 'user'
             AND entity_id = ?`,
          [user_id],
        );

        // 2) ลบคำขออนุมัติที่ user นี้เป็นคนส่ง
        //    approval_request_log จะโดน CASCADE ไปเอง
        await conn.execute(
          `DELETE FROM approval_request
           WHERE submitted_by = ?`,
          [user_id],
        );

        // 3) ลบผู้ใช้
        //    - email_verification_tokens / user_roles / user_session -> ON DELETE CASCADE
        //    - approval_request.reviewed_by / approval_request_log.actor_user_id -> ON DELETE SET NULL
        await conn.execute("DELETE FROM users WHERE user_id = ?", [user_id]);

        // 4) ถ้ามี person_id → ลบ person → cascade ไป person_* ทั้งหมด
        if (person_id) {
          await conn.execute("DELETE FROM person WHERE person_id = ?", [
            person_id,
          ]);
        }

        await conn.commit();
        conn.release();

        return NextResponse.json({
          message:
            "ลบบัญชีผู้ใช้และข้อมูลที่ผูกกับผู้ใช้นี้เรียบร้อยแล้ว",
        });
      } catch (err) {
        console.error("Error deleting user:", err);
        try {
          await pool.query("ROLLBACK");
        } catch {
          // เผื่อ rollback ซ้ำก็ไม่ต้องสน
        }
        return NextResponse.json(
          { message: "เกิดข้อผิดพลาดระหว่างลบบัญชีผู้ใช้" },
          { status: 500 },
        );
      }
    }

    // ปกติจะไม่มาถึงตรงนี้
    return NextResponse.json(
      { message: "ไม่รู้จัก action" },
      { status: 400 },
    );
  } catch (err) {
    console.error("Error in /api/admin/user-status:", err);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในฝั่งเซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}
