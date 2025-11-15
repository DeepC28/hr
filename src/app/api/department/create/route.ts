import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body?.code || "").trim();
    const name_th = String(body?.name_th || "").trim();
    const name_en = body?.name_en ? String(body.name_en).trim() : null;
    const parent_id = body?.parent_id ?? null;

    if (!code || !name_th) {
      return NextResponse.json({ ok: false, error: "code และ name_th จำเป็น" }, { status: 400 });
    }

    const pool = getPool();

    // ตรวจโค้ดซ้ำ
    const [dup]: any = await pool.query(`SELECT department_id FROM department WHERE code = ? LIMIT 1`, [code]);
    if (dup.length) {
      return NextResponse.json({ ok: false, error: "โค้ดซ้ำในระบบ" }, { status: 400 });
    }

    // ถ้ามี parent_id ตรวจว่าอยู่จริง
    if (parent_id !== null) {
      const [p]: any = await pool.query(`SELECT department_id FROM department WHERE department_id = ?`, [parent_id]);
      if (!p.length) {
        return NextResponse.json({ ok: false, error: "parent_id ไม่ถูกต้อง" }, { status: 400 });
      }
    }

    const [res]: any = await pool.query(
      `INSERT INTO department (code, name_th, name_en, parent_id) VALUES (?, ?, ?, ?)`,
      [code, name_th, name_en, parent_id]
    );

    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "สร้างไม่สำเร็จ" }, { status: 500 });
  }
}
