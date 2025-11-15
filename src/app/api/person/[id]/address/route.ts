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
      `SELECT home_no, moo, street, sub_district_id, zipcode
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
  const body = await req.json();

  let conn: mysql.Connection | null = null;
  try {
    conn = await getConn();
    await conn.execute(
      `UPDATE person SET
        home_no=?, moo=?, street=?, sub_district_id=?, zipcode=?, updated_at=CURRENT_TIMESTAMP
       WHERE person_id=?`,
      [
        body.home_no ?? null,
        body.moo ?? null,
        body.street ?? null,
        body.sub_district_id ?? null,
        body.zipcode ?? null,
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
