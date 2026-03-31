// src/app/api/admin/profile-reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

async function getColumns(conn: any, table: string): Promise<Set<string>> {
  const [rowsRaw] = await conn.query(`SHOW COLUMNS FROM \`${table}\``);
  const rows = rowsRaw as RowDataPacket[];
  const set = new Set<string>();
  for (const r of rows) set.add(String((r as any).Field));
  return set;
}
function pickCol(cols: Set<string>, candidates: string[], fallback: string | null = null) {
  for (const c of candidates) if (cols.has(c)) return c;
  return fallback;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

  const anySession = session as any;
  const adminUserId: number | null =
    anySession.user?.user_id ?? anySession.user?.id ?? anySession.user_id ?? anySession.id ?? null;

  if (!adminUserId) return NextResponse.json({ message: "ไม่สามารถระบุผู้ดำเนินการได้" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.user_id !== "number") {
    return NextResponse.json({ message: "รูปแบบข้อมูลไม่ถูกต้อง (ต้องมี user_id: number)" }, { status: 400 });
  }

  const targetUserId = body.user_id as number;
  const reviewNote: string | null =
    typeof body.review_note === "string" && body.review_note.trim() !== "" ? body.review_note.trim() : null;

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const reqCols = await getColumns(conn, "approval_request");
    const logCols = await getColumns(conn, "approval_request_log");

    const colApprovalId = pickCol(reqCols, ["approval_id"], "approval_id");
    const colStatus = pickCol(reqCols, ["status"], "status");
    const colSubmittedAt = pickCol(reqCols, ["submitted_at", "created_at"], "submitted_at");
    const colReviewedBy = pickCol(reqCols, ["reviewed_by"], null);
    const colReviewedAt = pickCol(reqCols, ["reviewed_at"], null);
    const colReviewedNote = pickCol(reqCols, ["review_note", "review_reason", "reason_note", "review_comment"], null);
    const colSubmittedBy = pickCol(reqCols, ["submitted_by", "created_by"], "submitted_by");

    const [reqRows] = await conn.query<RowDataPacket[]>(
      `
      SELECT ${colApprovalId} AS approval_id, ${colStatus} AS status
      FROM approval_request
      WHERE ${colSubmittedBy} = ?
        AND target_table = 'person'
        AND ${colStatus} = 'pending'
      ORDER BY ${colSubmittedAt} DESC, ${colApprovalId} DESC
      LIMIT 1
      `,
      [targetUserId],
    );

    if (reqRows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ message: "ไม่พบคำขอโปรไฟล์ที่รออนุมัติสำหรับผู้ใช้นี้" }, { status: 400 });
    }

    const approvalId = Number((reqRows[0] as any).approval_id);
    const oldStatus: string = (reqRows[0] as any).status || "pending";
    const finalReviewNote = reviewNote || "ยกเลิก/ตีกลับคำขอโดยผู้ดูแลระบบจากหน้า admin";

    const sets: string[] = [];
    const params: any[] = [];

    sets.push(`${colStatus} = 'rejected'`);
    if (colReviewedBy) { sets.push(`${colReviewedBy} = ?`); params.push(adminUserId); }
    if (colReviewedAt) { sets.push(`${colReviewedAt} = NOW()`); }
    if (colReviewedNote) { sets.push(`${colReviewedNote} = ?`); params.push(finalReviewNote); }
    params.push(approvalId);

    await conn.query(
      `UPDATE approval_request SET ${sets.join(", ")} WHERE ${colApprovalId} = ?`,
      params,
    );

    const hasActor = logCols.has("actor_user_id");
    const hasNote = logCols.has("note");
    const hasCreated = logCols.has("created_at");

    const cols: string[] = ["approval_id", "old_status", "new_status"];
    const vals: string[] = ["?", "?", "?"];
    const vparams: any[] = [approvalId, oldStatus, "rejected"];

    if (hasActor) { cols.push("actor_user_id"); vals.push("?"); vparams.push(adminUserId); }
    if (hasNote) { cols.push("note"); vals.push("?"); vparams.push(finalReviewNote); }
    if (hasCreated) { cols.push("created_at"); vals.push("NOW()"); }

    await conn.query(`INSERT INTO approval_request_log (${cols.join(", ")}) VALUES (${vals.join(", ")})`, vparams);

    await conn.commit();

    return NextResponse.json({
      message: "ยกเลิก/ตีกลับคำขอโปรไฟล์เรียบร้อยแล้ว",
      approval_id: approvalId,
    });
  } catch (err) {
    console.error("Profile reject error:", err);
    try { await conn.rollback(); } catch {}
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการยกเลิกคำขอ" }, { status: 500 });
  } finally {
    conn.release();
  }
}
