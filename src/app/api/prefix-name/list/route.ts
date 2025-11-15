// D:\Velentine\hr\src\app\api\gender\list\route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { tableFor, describeTable, stringColumns, primaryKey } from "../../_common/mysql";

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  // รูปแบบ path: /api/{entity}/list → entity จะอยู่ index 1
  const entity = url.pathname.split("/").filter(Boolean)[1];

  let conn: mysql.Connection | null = null;
  try {
    const table = tableFor(entity);
    const q = url.searchParams.get("q")?.trim();

    // อาศัย helper จาก _common (เปิด–ปิด conn ภายในฟังก์ชันของมันเอง)
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
