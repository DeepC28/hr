import { NextResponse } from "next/server";
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

export async function GET() {
  let conn: mysql.Connection | null = null;
  try {
    conn = await getConn();

    const [prefixes] = await conn.query(
      `SELECT prefix_id AS id, code, name_th, name_en FROM prefix_name ORDER BY name_th`
    );
    const [genders] = await conn.query(
      `SELECT gender_id AS id, code, name_th, name_en FROM gender ORDER BY name_th`
    );
    const [departments] = await conn.query(
      `SELECT department_id AS id, code, name_th, name_en FROM department ORDER BY name_th`
    );
    const [staffTypes] = await conn.query(
      `SELECT stafftype_id AS id, code, name_th, name_en FROM staff_type ORDER BY name_th`
    );

    return NextResponse.json({
      prefix_names: prefixes,
      genders,
      departments,
      staff_types: staffTypes,
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "โหลดตัวเลือกไม่สำเร็จ" }, { status: 500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}
