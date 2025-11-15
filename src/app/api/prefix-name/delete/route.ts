// src/app/api/master/[...any]/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import type { ResultSetHeader } from "mysql2/promise";
import { tableFor, describeTable, primaryKey } from "../../_common/mysql";

export const runtime = "nodejs";

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

/** ดึงชื่อ entity จาก path แบบยืดหยุ่น */
function extractEntity(pathname: string) {
  // รองรับ /api/master/{entity} หรือ /api/{entity}/delete
  const parts = pathname.split("/").filter(Boolean);
  const idxMaster = parts.indexOf("master");
  if (idxMaster >= 0 && parts[idxMaster + 1]) return parts[idxMaster + 1];

  const idxApi = parts.indexOf("api");
  if (idxApi >= 0 && parts[idxApi + 1]) return parts[idxApi + 1];

  // fallback: เอาตัวรองสุดท้าย (เช่น /api/prefix-name/delete)
  if (parts.length >= 2) return parts[parts.length - 2];
  // สุดท้ายจริง ๆ: ตัวสุดท้าย
  return parts[parts.length - 1];
}

/** ดึงค่า id จาก body หรือ query รองรับทั้ง ?id= และ ?{pk}= */
function extractId(url: URL, body: any, pk: string) {
  return (
    body?.[pk] ??
    body?.id ??
    url.searchParams.get(pk) ??
    url.searchParams.get("id")
  );
}

export async function DELETE(req: Request) {
  let conn: mysql.Connection | null = null;
  const url = new URL(req.url);

  try {
    const entity = extractEntity(url.pathname);
    const table = tableFor(entity);

    // body อาจไม่มีใน DELETE → ไม่ throw
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const cols = await describeTable(table);
    const pk = primaryKey(cols);

    let id: any = extractId(url, body, pk);
    if (id == null) {
      return NextResponse.json(
        { ok: false, error: `Missing primary key (${pk})`, entity },
        { status: 400 }
      );
    }

    // ถ้า id เป็นตัวเลข ลองแปลงเป็น number (จะช่วยให้ index ใช้งานได้ดีขึ้น)
    if (/^\d+$/.test(String(id))) id = Number(id);

    conn = await getConn();
    const sql = `DELETE FROM \`${table}\` WHERE \`${pk}\` = ?`;
    const [res] = await conn.execute<ResultSetHeader>(sql, [id]);

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
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  } finally {
    try {
      await conn?.end();
    } catch {}
  }
}
