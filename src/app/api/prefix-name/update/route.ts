// src/app/api/<entity>/update/route.ts (หรือไฟล์เดิมของคุณ)
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import type { ResultSetHeader } from "mysql2/promise";
import {
  tableFor,
  describeTable,
  filterPayloadToTable,
  primaryKey,
} from "../../_common/mysql";

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

/** ดึงชื่อ entity จาก path ให้ทนทานขึ้น */
function extractEntity(pathname: string) {
  // รองรับ /api/{entity}/update, /api/master/{entity}/update
  const parts = pathname.split("/").filter(Boolean);
  const idxMaster = parts.indexOf("master");
  if (idxMaster >= 0 && parts[idxMaster + 1]) return parts[idxMaster + 1];
  const idxApi = parts.indexOf("api");
  if (idxApi >= 0 && parts[idxApi + 1]) return parts[idxApi + 1];
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[parts.length - 1];
}

/** ดึงค่า id (primary key) จาก body หรือ query (?id= หรือ ?{pk}=) */
function extractId(url: URL, body: any, pk: string) {
  return (
    body?.[pk] ??
    body?.id ??
    url.searchParams.get(pk) ??
    url.searchParams.get("id")
  );
}

export async function PUT(req: Request) {
  const url = new URL(req.url);
  const entity = extractEntity(url.pathname);

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);
    const body = await req.json().catch(() => ({}));

    const cols = await describeTable(table);
    const pk = primaryKey(cols);

    const id = extractId(url, body, pk);
    if (id == null) {
      return NextResponse.json(
        { ok: false, error: `Missing primary key (${pk})`, entity },
        { status: 400 }
      );
    }

    // กรองฟิลด์ให้ตรงกับตาราง และกันไม่ให้แก้ไขคีย์หลัก
    const data = filterPayloadToTable(body, cols, true);
    delete (data as any)[pk];

    const fields = Object.keys(data);
    if (fields.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No fields to update", entity },
        { status: 400 }
      );
    }

    const setClause = fields.map((f) => `\`${f}\`=?`).join(", ");
    const sql = `UPDATE \`${table}\` SET ${setClause} WHERE \`${pk}\`=?`;
    const params = [...fields.map((f) => (data as any)[f]), id];

    conn = await getConn();
    const [res] = await conn.execute<ResultSetHeader>(sql, params);

    return NextResponse.json({
      ok: true,
      entity,
      table,
      pk,
      id,
      affectedRows: res.affectedRows ?? 0,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error", entity },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}
