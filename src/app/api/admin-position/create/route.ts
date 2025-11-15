import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { tableFor, describeTable, filterPayloadToTable, isAutoIncrement, primaryKey } from "../../_common/mysql";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const entity = url.pathname.split("/").filter(Boolean)[1];
  try {
    const table = tableFor(entity);
    const pool = getPool();
    const body = await req.json();
    const cols = await describeTable(table);
    const pk = primaryKey(cols);

    const data = filterPayloadToTable(body, cols, false);
    if (isAutoIncrement(cols, pk)) delete (data as any)[pk];

    const fields = Object.keys(data);
    if (!fields.length) return NextResponse.json({ ok:false, error: "No fields" }, { status: 400 });
    const placeholders = fields.map(()=>"?").join(",");
    const sql = `INSERT INTO \`${table}\` (${fields.map(f=>`\`${f}\``).join(",")}) VALUES (${placeholders})`;
    const params = fields.map(f => (data as any)[f]);

    await pool.query(sql, params);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? "Unknown error", entity }, { status: 500 });
  }
}