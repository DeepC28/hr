import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

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

const toInt = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const personId = toInt(params.id);
  if (!personId) return NextResponse.json({ message: "invalid id" }, { status: 400 });

  let conn: mysql.Connection | null = null;
  try {
    conn = await getConn();

    const [rows]: any[] = await conn.query(
      `SELECT person_id, prefix_id, first_name_th, last_name_th, first_name_en, last_name_en,
              gender_id, citizen_id, birthday, email, telephone, picture_url, stafftype_id
       FROM person WHERE person_id = ?`,
      [personId]
    );
    if (!rows.length) return NextResponse.json({ message: "not found" }, { status: 404 });

    const person = rows[0];

    const [deptRows]: any[] = await conn.query(
      `SELECT department_id FROM person_department
       WHERE person_id=? AND relation_level=1 AND is_primary=1 LIMIT 1`,
      [personId]
    );
    const department_id = deptRows[0]?.department_id ?? null;

    return NextResponse.json({ ...person, department_id });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "load failed" }, { status: 500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const personId = toInt(params.id);
  if (!personId) return NextResponse.json({ message: "invalid id" }, { status: 400 });

  const body = await req.json();

  let conn: mysql.Connection | null = null;
  try {
    conn = await getConn();
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE person SET
        prefix_id=?, first_name_th=?, last_name_th=?, first_name_en=?, last_name_en=?,
        gender_id=?, citizen_id=?, birthday=?, email=?, telephone=?, picture_url=?, stafftype_id=?,
        updated_at=CURRENT_TIMESTAMP
       WHERE person_id=?`,
      [
        body.prefix_id ?? null,
        body.first_name_th ?? "",
        body.last_name_th ?? "",
        body.first_name_en ?? null,
        body.last_name_en ?? null,
        body.gender_id ?? null,
        body.citizen_id ?? null,
        body.birthday ?? null,
        body.email ?? null,
        body.telephone ?? null,
        body.picture_url ?? null,
        body.stafftype_id ?? null,
        personId,
      ]
    );

    if (body.department_id) {
      await conn.execute(
        `UPDATE person_department SET is_primary=0 WHERE person_id=? AND relation_level=1`,
        [personId]
      );

      // primary key คือ (person_id, relation_level)
      await conn.execute(
        `INSERT INTO person_department (person_id, department_id, relation_level, is_primary)
         VALUES (?, ?, 1, 1)
         ON DUPLICATE KEY UPDATE department_id=VALUES(department_id), is_primary=1`,
        [personId, body.department_id]
      );
    } else {
      await conn.execute(
        `DELETE FROM person_department WHERE person_id=? AND relation_level=1`,
        [personId]
      );
    }

    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    try { await conn?.rollback(); } catch {}
    return NextResponse.json({ message: e?.message || "update failed" }, { status: 500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}
