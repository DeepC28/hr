// src/app/api/admin/profile-request-detail/route.ts
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userIdStr = searchParams.get("user_id");

  if (!userIdStr) return NextResponse.json({ message: "ต้องระบุ user_id ใน query string" }, { status: 400 });

  const userId = Number(userIdStr);
  if (!Number.isFinite(userId) || userId <= 0) return NextResponse.json({ message: "ค่า user_id ไม่ถูกต้อง" }, { status: 400 });

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    const cols = await getColumns(conn, "approval_request");

    const colApprovalId = pickCol(cols, ["approval_id"], "approval_id");
    const colAction = pickCol(cols, ["action"], "action");
    const colTargetTable = pickCol(cols, ["target_table"], "target_table");
    const colPkName = pickCol(cols, ["target_pk_name"], "target_pk_name");
    const colPkValue = pickCol(cols, ["target_pk_value"], "target_pk_value");
    const colProposed = pickCol(cols, ["proposed_data"], "proposed_data");
    const colCurrent = pickCol(cols, ["current_snapshot"], "current_snapshot");
    const colSubmittedAt = pickCol(cols, ["submitted_at", "created_at"], "submitted_at");
    const colStatus = pickCol(cols, ["status"], "status");
    const colSubmittedBy = pickCol(cols, ["submitted_by", "created_by"], "submitted_by");

    const [rows] = await conn.query<RowDataPacket[]>(
      `
      SELECT
        ${colApprovalId} AS approval_id,
        ${colAction} AS action,
        ${colTargetTable} AS target_table,
        ${colPkName} AS target_pk_name,
        ${colPkValue} AS target_pk_value,
        ${colProposed} AS proposed_data,
        ${colCurrent} AS current_snapshot,
        ${colSubmittedAt} AS submitted_at,
        ${colStatus} AS status
      FROM approval_request
      WHERE ${colSubmittedBy} = ?
        AND target_table = 'person'
        AND ${colStatus} = 'pending'
      ORDER BY ${colSubmittedAt} DESC, ${colApprovalId} DESC
      LIMIT 1
      `,
      [userId],
    );

    if (!rows.length) {
      return NextResponse.json({ message: "ไม่พบคำขอโปรไฟล์ที่รออนุมัติสำหรับผู้ใช้นี้" }, { status: 404 });
    }

    const row: any = rows[0];

    let proposed: any = null;
    let current: any = null;

    try { proposed = row.proposed_data ? JSON.parse(row.proposed_data as string) : null; } catch { proposed = null; }
    try { current = row.current_snapshot ? JSON.parse(row.current_snapshot as string) : null; } catch { current = null; }

    return NextResponse.json({
      approval_id: Number(row.approval_id),
      action: row.action as string,
      target_table: row.target_table as string,
      target_pk_name: row.target_pk_name as string,
      target_pk_value: (row.target_pk_value as string) || null,
      submitted_at: row.submitted_at ?? null,
      status: row.status as string,
      proposed,
      current,
    });
  } catch (err) {
    console.error("profile-request-detail error:", err);
    return NextResponse.json({ message: "ไม่สามารถดึงข้อมูลรายละเอียดคำขอได้" }, { status: 500 });
  } finally {
    conn.release();
  }
}
