import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body?.id ?? 0);
    if (!id) {
      return NextResponse.json({ ok: false, error: "id จำเป็น" }, { status: 400 });
    }
    const pool = getPool();

    // กันการลบถ้าเป็น parent ของคนอื่น (จะเลือก SET NULL ก่อนก็ได้)
    // ที่นี่ใช้ SET NULL ให้ลูก ๆ ก่อน
    await pool.query(`UPDATE department SET parent_id = NULL WHERE parent_id = ?`, [id]);

    const [res]: any = await pool.query(`DELETE FROM department WHERE department_id = ?`, [id]);

    if (!res.affectedRows) {
      return NextResponse.json({ ok: false, error: "ไม่พบรายการ" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
