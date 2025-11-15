import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body?.id ?? 0);
    const code = String(body?.code || "").trim();
    const name_th = String(body?.name_th || "").trim();
    const name_en = body?.name_en ? String(body.name_en).trim() : null;
    const parent_id = body?.parent_id ?? null;

    if (!id || !code || !name_th) {
      return NextResponse.json({ ok: false, error: "id, code และ name_th จำเป็น" }, { status: 400 });
    }
    if (parent_id === id) {
      return NextResponse.json({ ok: false, error: "ห้ามตั้ง parent เป็นตัวเอง" }, { status: 400 });
    }

    const pool = getPool();

    // มี item นี้ไหม
    const [cur]: any = await pool.query(`SELECT department_id FROM department WHERE department_id = ?`, [id]);
    if (!cur.length) {
      return NextResponse.json({ ok: false, error: "ไม่พบรายการ" }, { status: 404 });
    }

    // โค้ดซ้ำกับคนอื่นไหม
    const [dup]: any = await pool.query(
      `SELECT department_id FROM department WHERE code = ? AND department_id <> ? LIMIT 1`,
      [code, id]
    );
    if (dup.length) {
      return NextResponse.json({ ok: false, error: "โค้ดซ้ำในระบบ" }, { status: 400 });
    }

    // parent_id ถูกต้องไหม (ถ้ามี)
    if (parent_id !== null) {
      const [p]: any = await pool.query(`SELECT department_id FROM department WHERE department_id = ?`, [parent_id]);
      if (!p.length) {
        return NextResponse.json({ ok: false, error: "parent_id ไม่ถูกต้อง" }, { status: 400 });
      }
    }

    await pool.query(
      `UPDATE department SET code = ?, name_th = ?, name_en = ?, parent_id = ? WHERE department_id = ?`,
      [code, name_th, name_en, parent_id, id]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "อัปเดตไม่สำเร็จ" }, { status: 500 });
  }
}
