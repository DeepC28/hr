import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { tableFor, describeTable, stringColumns, primaryKey } from "../../_common/mysql";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const entity = url.pathname.split("/").filter(Boolean)[1]; // /api/{entity}/list
  try {
    const table = tableFor(entity);
    const pool = getPool();
    const q = url.searchParams.get("q")?.trim();
    const cols = await describeTable(table);
    const sCols = stringColumns(cols).map(c => `\`${c}\``);
    const pk = primaryKey(cols);

    let sql = `SELECT * FROM \`${table}\``;
    const params: any[] = [];
    if (q) {
      const like = `%${q}%`;
      const where = sCols.map(c => `${c} LIKE ?`).join(" OR ");
      sql += ` WHERE ${where}`;
      params.push(...Array(sCols.length).fill(like));
    }
    sql += ` ORDER BY \`${pk}\` DESC LIMIT 500`;

    const [rows] = await pool.query(sql, params);
    return NextResponse.json({ rows });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? "Unknown error", entity }, { status: 500 });
  }
}