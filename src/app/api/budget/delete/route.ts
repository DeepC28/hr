import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { tableFor, describeTable, primaryKey } from "../../_common/mysql";

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const entity = url.pathname.split("/").filter(Boolean)[1];
  try {
    const table = tableFor(entity);
    const pool = getPool();
    const body = await req.json();
    const cols = await describeTable(table);
    const pk = primaryKey(cols);
    const id = (body && body[pk]) ?? body?.id;
    if (!id) return NextResponse.json({ ok:false, error:`Missing primary key (${pk})` }, { status: 400 });

    const sql = `DELETE FROM \`${table}\` WHERE \`${pk}\`=?`;
    await pool.query(sql, [id]);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? "Unknown error", entity }, { status: 500 });
  }
}