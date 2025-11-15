// src/app/api/[entity]/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import type { ResultSetHeader } from "mysql2/promise";
import {
  tableFor,
  stringColumns,
  filterPayloadToTable,
  isAutoIncrement,
  primaryKey,
} from "../_common/mysql"; // ปรับ path หากไฟล์จริงต่างจากนี้

export const runtime = "nodejs"; // mysql2 ต้องใช้ Node runtime

// ---------- DB connection (ในไฟล์นี้) ----------
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

// ---------- Utils ----------
function qid(id: string) {
  return "`" + id.replace(/`/g, "``") + "`";
}

// ดึงชื่อ entity จาก path เช่น /api/gender → "gender"
function extractEntity(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const idxApi = parts.indexOf("api");
  if (idxApi >= 0 && parts[idxApi + 1]) return parts[idxApi + 1];
  // fallback: ตัวสุดท้าย
  return parts[parts.length - 1];
}

// ดึง PK id จาก body หรือ query (?id= หรือ ?{pk}=)
function extractId(url: URL, body: any, pk: string) {
  return (
    body?.[pk] ??
    body?.id ??
    url.searchParams.get(pk) ??
    url.searchParams.get("id")
  );
}

type ColumnDesc = {
  Field: string;
  Type: string;
  Null: "YES" | "NO";
  Key: "" | "PRI" | "MUL" | "UNI";
  Default: any;
  Extra: string;
};

// SHOW COLUMNS ภายในไฟล์ (ไม่ต้องพึ่ง describeTable ภายนอก)
async function describeTableLocal(conn: mysql.Connection, table: string): Promise<ColumnDesc[]> {
  const [rows] = await conn.query<any[]>(`SHOW COLUMNS FROM ${qid(table)}`);
  return rows as ColumnDesc[];
}

/** LIST: GET /api/<entity>?q=...  → { rows } */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const entity = extractEntity(url.pathname);

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);
    const q = url.searchParams.get("q")?.trim();

    conn = await getConn();

    const cols = await describeTableLocal(conn, table);
    const sCols = stringColumns(cols).map((c) => qid(c));
    const pk = primaryKey(cols);

    let sql = `SELECT * FROM ${qid(table)}`;
    let params: any[] = [];

    if (q && sCols.length) {
      const like = `%${q}%`;
      const where = sCols.map((c) => `${c} LIKE ?`).join(" OR ");
      sql += ` WHERE ${where}`;
      params = Array(sCols.length).fill(like);
    }
    sql += ` ORDER BY ${qid(pk)} DESC LIMIT 500`;

    const [rows] = await conn.query(sql, params);

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error", entity }, { status: 500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}

/** CREATE: POST /api/<entity>  (body = fields) → { ok, insertId } */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const entity = extractEntity(url.pathname);

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);
    const body = await req.json().catch(() => ({}));

    conn = await getConn();

    const cols = await describeTableLocal(conn, table);
    const pk = primaryKey(cols);

    const data = filterPayloadToTable(body, cols, false);
    if (isAutoIncrement(cols, pk)) delete (data as any)[pk];

    const fields = Object.keys(data);
    if (!fields.length) {
      return NextResponse.json({ ok: false, error: "No fields" }, { status: 400 });
    }

    const placeholders = fields.map(() => "?").join(",");
    const sql = `INSERT INTO ${qid(table)} (${fields.map(qid).join(",")}) VALUES (${placeholders})`;
    const params = fields.map((f) => (data as any)[f]);

    const [res] = await conn.execute<ResultSetHeader>(sql, params);

    return NextResponse.json({ ok: true, insertId: res.insertId ?? null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error", entity }, { status: 500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}

/** UPDATE: PUT /api/<entity>?id=...  (หรือ body มี {pk} / id) → { ok, affectedRows } */
export async function PUT(req: Request) {
  const url = new URL(req.url);
  const entity = extractEntity(url.pathname);

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);
    const body = await req.json().catch(() => ({}));

    conn = await getConn();

    const cols = await describeTableLocal(conn, table);
    const pk = primaryKey(cols);

    const id = extractId(url, body, pk);
    if (id == null) {
      return NextResponse.json({ ok: false, error: `Missing primary key (${pk})`, entity }, { status: 400 });
    }

    const data = filterPayloadToTable(body, cols, true);
    delete (data as any)[pk]; // กันแก้ pk

    const fields = Object.keys(data);
    if (!fields.length) {
      return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
    }

    const setClause = fields.map((f) => `${qid(f)}=?`).join(", ");
    const sql = `UPDATE ${qid(table)} SET ${setClause} WHERE ${qid(pk)}=?`;
    const params = [...fields.map((f) => (data as any)[f]), id];

    const [res] = await conn.execute<ResultSetHeader>(sql, params);

    return NextResponse.json({ ok: true, affectedRows: res.affectedRows ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error", entity }, { status: 500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}

/** DELETE: DELETE /api/<entity>?id=...  (หรือ body มี {pk} / id) → { ok, affectedRows } */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const entity = extractEntity(url.pathname);

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    conn = await getConn();

    const cols = await describeTableLocal(conn, table);
    const pk = primaryKey(cols);

    const id = extractId(url, body, pk);
    if (id == null) {
      return NextResponse.json({ ok: false, error: `Missing primary key (${pk})`, entity }, { status: 400 });
    }

    const [res] = await conn.execute<ResultSetHeader>(
      `DELETE FROM ${qid(table)} WHERE ${qid(pk)}=?`,
      [id]
    );

    return NextResponse.json({ ok: true, affectedRows: res.affectedRows ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error", entity }, { status: 500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}
