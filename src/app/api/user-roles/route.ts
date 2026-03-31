// src/app/api/user-roles/route.ts
import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { dbQuery, getPool } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

interface UserRow extends RowDataPacket {
  user_id: number;
  username: string;
  email: string | null;
  is_active: number;

  first_name_th: string | null;
  last_name_th: string | null;

  citizen_id: string | null;
  telephone: string | null;
  birthday: Date | string | null;

  stafftype_name_th: string | null;
  department_name_th: string | null;
}

interface RoleRow extends RowDataPacket {
  role_id: number;
  role_name: string;
  description: string | null;
  is_system: number;
}

interface UserRoleRow extends RowDataPacket {
  role_id: number;
}

// ===== GET /api/user-roles?query=xxx =====
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || !query.trim()) {
      return NextResponse.json(
        { message: "กรุณาระบุคำค้นหา (ชื่อ, username หรือ email)" },
        { status: 400 },
      );
    }

    const q = query.trim();
    const like = `%${q}%`;

    // หา user จาก:
    // - username (ตรงตัว / LIKE)
    // - email (ตรงตัว / LIKE)
    // - first_name_th LIKE
    // - last_name_th LIKE
    // - "ชื่อ สกุล" = CONCAT(first_name_th, ' ', last_name_th) LIKE
    const [userRows] = await dbQuery<UserRow[]>(
      `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.is_active,

        p.first_name_th,
        p.last_name_th,
        p.citizen_id,
        p.telephone,
        p.birthday,

        st.name_th AS stafftype_name_th,
        d.name_th  AS department_name_th
      FROM users u
      LEFT JOIN person p
        ON p.person_id = u.person_id
      LEFT JOIN staff_type st
        ON st.stafftype_id = p.stafftype_id
      LEFT JOIN person_department pd
        ON pd.person_id = p.person_id
       AND pd.relation_level = 1
       AND pd.is_primary = 1
      LEFT JOIN department d
        ON d.department_id = pd.department_id
      WHERE
        u.username = ?
        OR u.email = ?
        OR u.username LIKE ?
        OR u.email LIKE ?
        OR p.first_name_th LIKE ?
        OR p.last_name_th LIKE ?
        OR CONCAT(p.first_name_th, ' ', p.last_name_th) LIKE ?
      ORDER BY u.user_id ASC
      LIMIT 1
      `,
      [q, q, like, like, like, like, like],
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา" },
        { status: 404 },
      );
    }

    const u = userRows[0];

    const fullName =
      u.first_name_th && u.last_name_th
        ? `${u.first_name_th} ${u.last_name_th}`
        : null;

    const person =
      u.first_name_th ||
      u.last_name_th ||
      u.citizen_id ||
      u.telephone ||
      u.birthday ||
      u.stafftype_name_th ||
      u.department_name_th
        ? {
            citizen_id: u.citizen_id || null,
            telephone: u.telephone || null,
            birthday: u.birthday
              ? String(u.birthday).slice(0, 10)
              : null,
            stafftype_name_th: u.stafftype_name_th || null,
            department_name_th: u.department_name_th || null,
          }
        : null;

    // ดึง roles ทั้งหมด
    const [roleRows] = await dbQuery<RoleRow[]>(
      `
      SELECT
        role_id,
        role_name,
        description,
        is_system
      FROM roles
      ORDER BY is_system DESC, role_id ASC
      `,
      [],
    );

    // ดึง role ของ user นี้
    const [urRows] = await dbQuery<UserRoleRow[]>(
      `
      SELECT role_id
      FROM user_roles
      WHERE user_id = ?
      `,
      [u.user_id],
    );

    const userRoleIds = urRows.map((r) => r.role_id);

    return NextResponse.json(
      {
        user: {
          user_id: u.user_id,
          username: u.username,
          email: u.email,
          is_active: !!u.is_active,
          full_name_th: fullName,
          person,
        },
        roles: roleRows.map((r) => ({
          role_id: r.role_id,
          role_name: r.role_name,
          description: r.description,
          is_system: !!r.is_system,
        })),
        userRoleIds,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("UserRoles GET error:", err);
    return NextResponse.json(
      { message: "ไม่สามารถค้นหาผู้ใช้หรือโหลดบทบาทได้" },
      { status: 500 },
    );
  }
}

// ===== POST /api/user-roles =====
// body: { user_id: number, role_ids: number[] }
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
      typeof body.user_id !== "number" ||
      !Array.isArray(body.role_ids)
    ) {
      return NextResponse.json(
        { message: "รูปแบบข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const userId = Number(body.user_id);
    const roleIdsRaw = body.role_ids as any[];

    const roleIds = roleIdsRaw
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    // เช็คว่าผู้ใช้มีจริงไหม
    const [userRows] = await dbQuery<RowDataPacket[]>(
      `
      SELECT user_id
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId],
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้ที่ต้องการกำหนดบทบาท" },
        { status: 404 },
      );
    }

    // ถ้ามี roleIds ให้เช็คด้วยว่าทุก role_id มีอยู่จริงในตาราง roles
    if (roleIds.length > 0) {
      const placeholders = roleIds.map(() => "?").join(",");
      const [checkRoleRows] = await dbQuery<RowDataPacket[]>(
        `
        SELECT role_id
        FROM roles
        WHERE role_id IN (${placeholders})
        `,
        roleIds,
      );

      const existingIds = new Set(
        checkRoleRows.map((r: any) => Number(r.role_id)),
      );

      const invalidIds = roleIds.filter((id) => !existingIds.has(id));
      if (invalidIds.length > 0) {
        return NextResponse.json(
          {
            message: `พบ role_id ที่ไม่ถูกต้อง: ${invalidIds.join(
              ", ",
            )} (ไม่มีอยู่ในตาราง roles)`,
          },
          { status: 400 },
        );
      }
    }

    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();

      const [delResult] = await conn.execute<ResultSetHeader>(
        `
        DELETE FROM user_roles
        WHERE user_id = ?
        `,
        [userId],
      );

      let inserted = 0;

      if (roleIds.length > 0) {
        const values = roleIds.map(() => "(?, ?)").join(",");
        const params: any[] = [];
        roleIds.forEach((rid) => {
          params.push(userId, rid);
        });

        const [insResult] = await conn.execute<ResultSetHeader>(
          `
          INSERT INTO user_roles (user_id, role_id)
          VALUES ${values}
          `,
          params,
        );
        inserted = insResult.affectedRows;
      }

      await conn.commit();

      return NextResponse.json(
        {
          message: "บันทึกการกำหนดบทบาทให้ผู้ใช้เรียบร้อยแล้ว",
          deleted: (delResult as ResultSetHeader).affectedRows,
          inserted,
        },
        { status: 200 },
      );
    } catch (innerErr) {
      await conn.rollback();
      console.error("UserRoles POST inner transaction error:", innerErr);

      const msg =
        (innerErr as any)?.message ||
        "เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล (transaction)";

      return NextResponse.json({ message: msg }, { status: 500 });
    } finally {
      conn.release();
    }
  } catch (err: any) {
    console.error("UserRoles POST error:", err);
    return NextResponse.json(
      {
        message:
          err?.message ||
          "ไม่สามารถบันทึกการกำหนดบทบาทให้ผู้ใช้ได้ (เกิดข้อผิดพลาดภายในระบบ)",
      },
      { status: 500 },
    );
  }
}
