// D:\Velentine\hr\src\app\api\<entity>\create\route.ts (หรือไฟล์เดิมของคุณ)
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import type { ResultSetHeader } from "mysql2/promise";
import {
  tableFor,
  describeTable,
  filterPayloadToTable,
  isAutoIncrement,
  primaryKey,
} from "../../_common/mysql";

export const runtime = "nodejs"; // mysql2 ต้องใช้ Node runtime

function extractEntity(pathname: string) {
  // รูปแบบที่ใช้: /api/{entity}/create หรือ /api/{entity}
  const parts = pathname.split("/").filter(Boolean);
  // หา segment หลัง "api"
  const apiIdx = parts.indexOf("api");
  if (apiIdx >= 0 && parts[apiIdx + 1]) return parts[apiIdx + 1];
  // fallback เอาตัวรองสุดท้าย (ก่อน action)
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[parts.length - 1];
}

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

export async function POST(req: Request) {
  const url = new URL(req.url);
  const entity = extractEntity(url.pathname);

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);
    const body = await req.json();

    const cols = await describeTable(table);
    const pk = primaryKey(cols);

    // กรองฟิลด์ให้ตรงตาราง และไม่รวม PK ถ้าเป็น auto_increment
    const data = filterPayloadToTable(body, cols, false);
    if (isAutoIncrement(cols, pk)) delete (data as any)[pk];

    const fields = Object.keys(data);
    if (!fields.length) {
      return NextResponse.json({ ok: false, error: "No fields" }, { status: 400 });
    }

    const placeholders = fields.map(() => "?").join(",");
    const sql = `INSERT INTO \`${table}\` (${fields.map((f) => `\`${f}\``).join(",")}) VALUES (${placeholders})`;
    const params = fields.map((f) => (data as any)[f]);

    conn = await getConn();
    const [res] = await conn.execute<ResultSetHeader>(sql, params);

    return NextResponse.json({ ok: true, insertId: (res as ResultSetHeader).insertId ?? null });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error", entity },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}
