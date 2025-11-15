// src/app/api/<entity>/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import type { ResultSetHeader } from "mysql2/promise";
import {
  tableFor,
  describeTable,
  stringColumns,
  filterPayloadToTable,
  isAutoIncrement,
  primaryKey,
} from "../_common/mysql"; // ปรับ path ถ้าโปรเจ็กต์จริงใช้ "../../_common/mysql"

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

// /api/<entity> → "entity"
function extractEntity(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const i = parts.indexOf("api");
  if (i >= 0 && parts[i + 1]) return parts[i + 1];
  return parts[parts.length - 1];
}

// ดึง id/PK จาก body หรือ query (?id= หรือ ?{pk}=)
function extractId(url: URL, body: any, pk: string) {
  return (
    body?.[pk] ??
    body?.id ??
    url.searchParams.get(pk) ??
    url.searchParams.get("id")
  );
}

/** LIST: GET /api/<entity>?q=... */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const entity = extractEntity(url.pathname);

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);
    const q = url.searchParams.get("q")?.trim() ?? "";

    const cols = await describeTable(table);
    const sCols = stringColumns(cols).map((c) => `\`${c}\``);
    const pk = primaryKey(cols);

    let sql = `SELECT * FROM \`${table}\``;
    let params: any[] = [];

    if (q) {
      const like = `%${q}%`;
      const where = sCols.map((c) => `${c} LIKE ?`).join(" OR ");
      sql += ` WHERE ${where}`;
      params = Array(sCols.length).fill(like);
    }
    sql += ` ORDER BY \`${pk}\` DESC LIMIT 500`;

    conn = await getConn();
    const [rows] = await conn.query(sql, params);

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error", entity },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}

/** CREATE: POST /api/<entity> */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const entity = extractEntity(url.pathname);

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);
    const body = await req.json().catch(() => ({}));

    const cols = await describeTable(table);
    const pk = primaryKey(cols);

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

    return NextResponse.json({ ok: true, insertId: res.insertId ?? null });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error", entity },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}

/** UPDATE: PUT /api/<entity>?id=...  (หรือ body มี {pk}/id) */
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

    const data = filterPayloadToTable(body, cols, true);
    delete (data as any)[pk]; // กันแก้ pk

    const fields = Object.keys(data);
    if (!fields.length) {
      return NextResponse.json(
        { ok: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const setClause = fields.map((f) => `\`${f}\`=?`).join(", ");
    const sql = `UPDATE \`${table}\` SET ${setClause} WHERE \`${pk}\`=?`;
    const params = [...fields.map((f) => (data as any)[f]), id];

    conn = await getConn();
    const [res] = await conn.execute<ResultSetHeader>(sql, params);

    return NextResponse.json({ ok: true, affectedRows: res.affectedRows ?? 0 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error", entity },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}

/** DELETE: DELETE /api/<entity>?id=...  (หรือ body มี {pk}/id) */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const entity = extractEntity(url.pathname);

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const cols = await describeTable(table);
    const pk = primaryKey(cols);

    const id = extractId(url, body, pk);
    if (id == null) {
      return NextResponse.json(
        { ok: false, error: `Missing primary key (${pk})`, entity },
        { status: 400 }
      );
    }

    conn = await getConn();
    const [res] = await conn.execute<ResultSetHeader>(
      `DELETE FROM \`${table}\` WHERE \`${pk}\`=?`,
      [id]
    );

    return NextResponse.json({ ok: true, affectedRows: res.affectedRows ?? 0 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error", entity },
      { status: 500 }
    );
  } finally {
    try { await conn?.end(); } catch {}
  }
}
