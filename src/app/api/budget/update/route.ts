import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { tableFor, describeTable, filterPayloadToTable, primaryKey } from "../../_common/mysql";

export async function PUT(req: Request) {
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

    const data = filterPayloadToTable(body, cols, true);
    delete (data as any)[pk];

    const fields = Object.keys(data);
    if (!fields.length) return NextResponse.json({ ok:false, error: "No fields to update" }, { status: 400 });
    const setClause = fields.map(f => `\`${f}\`=?`).join(",");
    const sql = `UPDATE \`${table}\` SET ${setClause} WHERE \`${pk}\`=?`;
    const params = [...fields.map(f => (data as any)[f]), id];

    await pool.query(sql, params);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? "Unknown error", entity }, { status: 500 });
  }
}