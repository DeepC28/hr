// src/app/api/department/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import type { ResultSetHeader } from "mysql2/promise";

export const runtime = "nodejs"; // mysql2 ต้องใช้ Node runtime

async function getConn() {
  return mysql.createConnection({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME || "hr",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    charset: "utf8mb4_general_ci",
  });
}

/** ----------------------------------------------------------------
 * LIST: GET /api/department?q=...
 * (คงรูปแบบเหมือนเดิม: คืน array ของแถว)
 * ---------------------------------------------------------------- */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  let conn: mysql.Connection | null = null;
  try {
    let sql = `
      SELECT d.department_id, d.code, d.name_th, d.name_en, d.parent_id,
             p.name_th AS parent_name
      FROM department d
      LEFT JOIN department p ON p.department_id = d.parent_id
    `;
    const params: any[] = [];

    if (q) {
      sql += ` WHERE d.code LIKE ? OR d.name_th LIKE ? OR p.name_th LIKE ? `;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += ` ORDER BY d.code ASC `;

    conn = await getConn();
    const [rows] = await conn.query(sql, params);
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "โหลดรายการไม่สำเร็จ" },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}

/** ----------------------------------------------------------------
 * CREATE: POST /api/department
 * body: { code, name_th, name_en?, parent_id? }
 * ---------------------------------------------------------------- */
export async function POST(req: Request) {
  let conn: mysql.Connection | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body?.code || "").trim();
    const name_th = String(body?.name_th || "").trim();
    const name_en = body?.name_en ? String(body.name_en).trim() : null;
    const parent_id = body?.parent_id ?? null;

    if (!code || !name_th) {
      return NextResponse.json(
        { ok: false, error: "code และ name_th จำเป็น" },
        { status: 400 }
      );
    }

    conn = await getConn();

    // ตรวจโค้ดซ้ำ
    {
      const [dup]: any = await conn.query(
        `SELECT department_id FROM department WHERE code = ? LIMIT 1`,
        [code]
      );
      if (dup.length) {
        return NextResponse.json(
          { ok: false, error: "โค้ดซ้ำในระบบ" },
          { status: 400 }
        );
      }
    }

    // ถ้ามี parent_id ตรวจว่าอยู่จริง
    if (parent_id !== null) {
      const [p]: any = await conn.query(
        `SELECT department_id FROM department WHERE department_id = ?`,
        [parent_id]
      );
      if (!p.length) {
        return NextResponse.json(
          { ok: false, error: "parent_id ไม่ถูกต้อง" },
          { status: 400 }
        );
      }
    }

    const [res] = await conn.execute<ResultSetHeader>(
      `INSERT INTO department (code, name_th, name_en, parent_id) VALUES (?, ?, ?, ?)`,
      [code, name_th, name_en, parent_id]
    );

    return NextResponse.json({ ok: true, id: (res as ResultSetHeader).insertId });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "สร้างไม่สำเร็จ" },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}

/** ----------------------------------------------------------------
 * UPDATE: PUT /api/department
 * body: { id, code, name_th, name_en?, parent_id? }
 * ---------------------------------------------------------------- */
export async function PUT(req: Request) {
  let conn: mysql.Connection | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id ?? 0);
    const code = String(body?.code || "").trim();
    const name_th = String(body?.name_th || "").trim();
    const name_en = body?.name_en ? String(body.name_en).trim() : null;
    const parent_id = body?.parent_id ?? null;

    if (!id || !code || !name_th) {
      return NextResponse.json(
        { ok: false, error: "id, code และ name_th จำเป็น" },
        { status: 400 }
      );
    }
    if (parent_id === id) {
      return NextResponse.json(
        { ok: false, error: "ห้ามตั้ง parent เป็นตัวเอง" },
        { status: 400 }
      );
    }

    conn = await getConn();

    // มี item นี้ไหม
    {
      const [cur]: any = await conn.query(
        `SELECT department_id FROM department WHERE department_id = ?`,
        [id]
      );
      if (!cur.length) {
        return NextResponse.json(
          { ok: false, error: "ไม่พบรายการ" },
          { status: 404 }
        );
      }
    }

    // โค้ดซ้ำกับคนอื่นไหม
    {
      const [dup]: any = await conn.query(
        `SELECT department_id FROM department WHERE code = ? AND department_id <> ? LIMIT 1`,
        [code, id]
      );
      if (dup.length) {
        return NextResponse.json(
          { ok: false, error: "โค้ดซ้ำในระบบ" },
          { status: 400 }
        );
      }
    }

    // parent_id ถูกต้องไหม (ถ้ามี)
    if (parent_id !== null) {
      const [p]: any = await conn.query(
        `SELECT department_id FROM department WHERE department_id = ?`,
        [parent_id]
      );
      if (!p.length) {
        return NextResponse.json(
          { ok: false, error: "parent_id ไม่ถูกต้อง" },
          { status: 400 }
        );
      }
    }

    await conn.execute<ResultSetHeader>(
      `UPDATE department
         SET code = ?, name_th = ?, name_en = ?, parent_id = ?
       WHERE department_id = ?`,
      [code, name_th, name_en, parent_id, id]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "อัปเดตไม่สำเร็จ" },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}

/** ----------------------------------------------------------------
 * DELETE: DELETE /api/department
 * body: { id }
 * (set NULL ให้ลูก ๆ ก่อน จากนั้นค่อยลบ)
 * ---------------------------------------------------------------- */
export async function DELETE(req: Request) {
  let conn: mysql.Connection | null = null;
  try {
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const id = Number(body?.id ?? 0);
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id จำเป็น" },
        { status: 400 }
      );
    }

    conn = await getConn();

    await conn.execute<ResultSetHeader>(
      `UPDATE department SET parent_id = NULL WHERE parent_id = ?`,
      [id]
    );

    const [res] = await conn.execute<ResultSetHeader>(
      `DELETE FROM department WHERE department_id = ?`,
      [id]
    );

    if (!(res as ResultSetHeader).affectedRows) {
      return NextResponse.json(
        { ok: false, error: "ไม่พบรายการ" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "ลบไม่สำเร็จ" },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}
