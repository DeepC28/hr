// src/app/api/person/list/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

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

export async function GET(req: Request) {
  let conn: mysql.Connection | null = null;
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    conn = await getConn();

    // NOTE:
    // - เปลี่ยน :kw → ? และส่งพารามิเตอร์ซ้ำ 7 ครั้งให้ครบทุก field
    // - subquery เลือก department หลัก (is_primary=1) ถ้าไม่มี ใช้ relation_level ต่ำสุด
    const where =
      q &&
      `WHERE (
        p.citizen_id   LIKE ?
        OR p.first_name_th LIKE ?
        OR p.last_name_th  LIKE ?
        OR p.email         LIKE ?
        OR p.telephone     LIKE ?
        OR d.name_th       LIKE ?
        OR p.position_work LIKE ?
      )`;

    const sql = `
      SELECT
        p.person_id,
        p.citizen_id,
        p.first_name_th,
        p.last_name_th,
        p.email,
        p.telephone,
        p.picture_url,
        pd.department_id,
        d.name_th AS department_name,
        p.position_work AS position_title
      FROM person p
      LEFT JOIN (
        SELECT x.person_id, x.department_id
        FROM person_department x
        LEFT JOIN (
          SELECT person_id, MIN(relation_level) AS min_level
          FROM person_department
          GROUP BY person_id
        ) m ON m.person_id = x.person_id AND x.relation_level = m.min_level
        WHERE x.is_primary = 1 OR m.min_level = x.relation_level
        GROUP BY x.person_id
      ) pd ON pd.person_id = p.person_id
      LEFT JOIN department d ON d.department_id = pd.department_id
      ${where || ""}
      ORDER BY p.last_name_th, p.first_name_th
      LIMIT 1000
    `;

    const kw = `%${q}%`;
    const params: any[] = q ? [kw, kw, kw, kw, kw, kw, kw] : [];

    const [rows] = await conn.query<RowDataPacket[]>(sql, params);

    return NextResponse.json(rows, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  } finally {
    try {
      await conn?.end();
    } catch {}
  }
}
