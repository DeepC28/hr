// src/app/api/person/delete/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id || 0);
    if (!id) return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });

    const pool = getPool();

    // ตรวจว่ามีอยู่จริงไหม
    const [chk] = await pool.query("SELECT person_id FROM person WHERE person_id = ?", [id]);
    // @ts-ignore
    if (!chk || chk.length === 0) {
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    }

    // ลบตัวบุคคล (ตารางลูกส่วนใหญ่ cascade/set null อยู่แล้ว)
    await pool.query("DELETE FROM person WHERE person_id = ?", [id]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
