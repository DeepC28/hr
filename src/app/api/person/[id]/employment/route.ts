import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

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

const toInt = (v:any)=>{ const n = Number(v); return Number.isFinite(n) ? n : null; };

export async function GET(_: NextRequest, { params }: { params: { id: string }}) {
  const id = toInt(params.id);
  if (!id) return NextResponse.json({ message:"invalid id" }, { status:400 });

  let conn: mysql.Connection | null = null;
  try {
    conn = await getConn();

    const [rows]: any[] = await conn.query(
      `SELECT
        univ_id, nationality_id, stafftype_id, substafftype_id,
        time_contract_id, contract_end_date, budget_id,
        admin_position_id, academicstanding_id, positionlevel_id,
        position_work, rate_number, status_text,
        date_inwork, date_start_this_u,
        income_amount, cost_of_living
       FROM person WHERE person_id=?`, [id]
    );
    if (!rows.length) return NextResponse.json({ message:"not found" }, { status:404 });
    return NextResponse.json(rows[0]);
  } catch (e:any) {
    return NextResponse.json({ message:e?.message || "load failed" }, { status:500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string }}) {
  const id = toInt(params.id);
  if (!id) return NextResponse.json({ message:"invalid id" }, { status:400 });
  const b = await req.json();

  let conn: mysql.Connection | null = null;
  try {
    conn = await getConn();
    await conn.execute(
      `UPDATE person SET
        univ_id=?, nationality_id=?, stafftype_id=?, substafftype_id=?,
        time_contract_id=?, contract_end_date=?, budget_id=?,
        admin_position_id=?, academicstanding_id=?, positionlevel_id=?,
        position_work=?, rate_number=?, status_text=?,
        date_inwork=?, date_start_this_u=?,
        income_amount=?, cost_of_living=?, updated_at=CURRENT_TIMESTAMP
       WHERE person_id=?`,
      [
        b.univ_id ?? null, b.nationality_id ?? null, b.stafftype_id ?? null, b.substafftype_id ?? null,
        b.time_contract_id ?? null, b.contract_end_date ?? null, b.budget_id ?? null,
        b.admin_position_id ?? null, b.academicstanding_id ?? null, b.positionlevel_id ?? null,
        b.position_work ?? null, b.rate_number ?? null, b.status_text ?? null,
        b.date_inwork ?? null, b.date_start_this_u ?? null,
        b.income_amount ?? null, b.cost_of_living ?? null,
        id,
      ]
    );
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ message:e?.message || "update failed" }, { status:500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}
