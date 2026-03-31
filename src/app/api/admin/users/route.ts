// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbQuery } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

interface AdminUserRow extends RowDataPacket {
  user_id: number;
  username: string;
  email: string | null;
  is_active: number;
  created_at: Date | string | null;
  role_name: string | null;
  has_pending_profile: number;

  person_first_name_th: string | null;
  person_last_name_th: string | null;
  person_citizen_id: string | null;
  person_telephone: string | null;
  person_birthday: Date | string | null;
  stafftype_name_th: string | null;
  department_name_th: string | null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);

    if (!session) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 },
      );
    }

    const anySession = session as any;
    const sessionRole = anySession.user?.role ?? null;

    // ถ้าจะล็อกเฉพาะ admin จริง ๆ ให้เปิดอันนี้
    // if (sessionRole !== "admin" && sessionRole !== 1) {
    //   return NextResponse.json(
    //     { message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" },
    //     { status: 403 },
    //   );
    // }

    const [rows] = await dbQuery<AdminUserRow[]>(
      `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.is_active,
        u.created_at,
        MAX(r.role_name) AS role_name,
        EXISTS (
          SELECT 1
          FROM approval_request ar
          WHERE ar.submitted_by = u.user_id
            AND ar.target_table = 'person'
            AND ar.status = 'pending'
        ) AS has_pending_profile,

        -- person / staff / department
        p.first_name_th AS person_first_name_th,
        p.last_name_th  AS person_last_name_th,
        p.citizen_id    AS person_citizen_id,
        p.telephone     AS person_telephone,
        p.birthday      AS person_birthday,
        st.name_th      AS stafftype_name_th,
        d_main.name_th  AS department_name_th

      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.user_id
      LEFT JOIN roles r       ON r.role_id  = ur.role_id

      LEFT JOIN person p          ON p.person_id       = u.person_id
      LEFT JOIN staff_type st     ON st.stafftype_id   = p.stafftype_id
      LEFT JOIN person_department pd
        ON pd.person_id = p.person_id
       AND pd.is_primary = 1
      LEFT JOIN department d_main ON d_main.department_id = pd.department_id

      GROUP BY
        u.user_id,
        u.username,
        u.email,
        u.is_active,
        u.created_at,
        p.first_name_th,
        p.last_name_th,
        p.citizen_id,
        p.telephone,
        p.birthday,
        st.name_th,
        d_main.name_th

      ORDER BY u.user_id ASC
      `,
    );

    const users = rows.map((r) => {
      const roleName = (r.role_name as string | null) || null;
      let level: "admin" | "user" | "other" = "other";

      if (roleName) {
        const lower = roleName.toLowerCase();
        if (lower.includes("admin")) level = "admin";
        else if (lower.includes("user")) level = "user";
        else level = "other";
      }

      const createdAt =
        r.created_at != null
          ? new Date(r.created_at as any).toISOString()
          : null;

      const birthday =
        r.person_birthday != null
          ? new Date(r.person_birthday as any).toISOString().slice(0, 10)
          : null;

      const firstName = r.person_first_name_th;
      const lastName = r.person_last_name_th;

      const hasPersonData =
        firstName ||
        lastName ||
        r.person_citizen_id ||
        r.person_telephone ||
        r.stafftype_name_th ||
        r.department_name_th ||
        birthday;

      return {
        user_id: Number(r.user_id),
        username: r.username as string,
        email: (r.email as string) || null,
        is_active: Boolean(r.is_active),
        created_at: createdAt,
        role_name: roleName,
        level,
        has_pending_profile: Boolean(r.has_pending_profile),
        person: hasPersonData
          ? {
              full_name_th:
                firstName && lastName ? `${firstName} ${lastName}` : null,
              citizen_id: r.person_citizen_id,
              telephone: r.person_telephone,
              stafftype_name_th: r.stafftype_name_th,
              department_name_th: r.department_name_th,
              birthday,
            }
          : null,
      };
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Admin users list error:", err);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" },
      { status: 500 },
    );
  }
}
