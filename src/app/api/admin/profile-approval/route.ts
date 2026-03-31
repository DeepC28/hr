// src/app/api/admin/profile-approval/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { withConn } from "@/lib/mysql";
import path from "path";
import { promises as fs } from "fs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

type ChangeRow = {
  key: string;
  label: string;
  old_value: string;
  new_value: string;
};

type AttachmentItem = {
  label: string;
  url: string;
  section: string;
  index?: number;
  kind: "pdf" | "image" | "other";
};

function isObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function parseJsonField(raw: any) {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeString(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function guessKindFromUrl(url: string): AttachmentItem["kind"] {
  const u = (url || "").toLowerCase();
  if (u.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "image";
  if (u.match(/\.pdf($|\?)/)) return "pdf";
  return "other";
}

function labelOfPersonKey(col: string) {
  const map: Record<string, string> = {
    picture_url: "รูปโปรไฟล์",
    telephone: "เบอร์โทร",
    email: "อีเมล",
    citizen_id: "เลขบัตรประชาชน",
    first_name_th: "ชื่อ (ไทย)",
    last_name_th: "นามสกุล (ไทย)",
  };
  return map[col] || col;
}

const PERSON_ALLOWED = new Set([
  "picture_url",
  "telephone",
  "email",
  "citizen_id",
  "first_name_th",
  "last_name_th",
  "first_name_en",
  "last_name_en",
  "birthday",
  "rate_number",
  "stafftype_id",
  "department_id",
]);

function pickPersonAllowedColumns(obj: Record<string, any>) {
  const picked: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (PERSON_ALLOWED.has(k)) picked[k] = v;
  }
  return picked;
}

// ✅ ทนหลายโครงสร้าง proposed_data
function extractSetObject(proposed: any): Record<string, any> {
  if (!proposed) return {};
  const direct =
    (isObject(proposed?.set) && proposed.set) ||
    (isObject(proposed?.data) && proposed.data) ||
    (isObject(proposed?.update) && proposed.update);
  if (direct) {
    const picked = pickPersonAllowedColumns(direct);
    if (Object.keys(picked).length) return picked;
  }

  if (isObject(proposed)) {
    const picked = pickPersonAllowedColumns(proposed);
    if (Object.keys(picked).length) return picked;
  }

  // deep search
  const maxDepth = 4;
  const walk = (node: any, depth: number): Record<string, any> => {
    if (!node || depth > maxDepth) return {};
    if (Array.isArray(node)) {
      for (const it of node) {
        const found = walk(it, depth + 1);
        if (Object.keys(found).length) return found;
      }
      return {};
    }
    if (!isObject(node)) return {};
    const keys = Object.keys(node);
    let hit = 0;
    for (const k of keys) if (PERSON_ALLOWED.has(k)) hit++;
    if (hit >= 1) {
      const picked = pickPersonAllowedColumns(node);
      if (Object.keys(picked).length) return picked;
    }
    for (const k of keys) {
      const found = walk((node as any)[k], depth + 1);
      if (Object.keys(found).length) return found;
    }
    return {};
  };

  return walk(proposed, 0);
}

function extractAttachments(proposed: any): AttachmentItem[] {
  const out: AttachmentItem[] = [];
  if (Array.isArray(proposed?.attachments)) {
    for (let i = 0; i < proposed.attachments.length; i++) {
      const a = proposed.attachments[i];
      const url = safeString(a?.url || "");
      if (!url) continue;
      out.push({
        label: safeString(a?.label || "ไฟล์แนบ"),
        url,
        section: safeString(a?.section || "other"),
        index: typeof a?.index === "number" ? a.index : i,
        kind: (a?.kind as any) || guessKindFromUrl(url),
      });
    }
  }
  // unique
  const m = new Map<string, AttachmentItem>();
  for (const a of out) m.set(`${a.section}::${a.url}`, a);
  return Array.from(m.values());
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session) return { ok: false as const, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  if (role !== "admin") return { ok: false as const, res: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };

  const actorUserId = Number((session.user as any)?.user_id ?? (session.user as any)?.id ?? 0);
  return { ok: true as const, actorUserId };
}

async function findLatestPendingApprovalForUser(conn: PoolConnection, userId: number) {
  const [uRows] = await conn.query<RowDataPacket[]>(
    `SELECT user_id, person_id FROM users WHERE user_id=? LIMIT 1`,
    [userId],
  );
  const personId = uRows?.length && uRows[0].person_id != null ? String(uRows[0].person_id) : null;

  const [rows] = await conn.query<RowDataPacket[]>(
    `
    SELECT *
    FROM approval_request
    WHERE status='pending'
      AND (
        submitted_by = ?
        OR (target_table='users' AND target_pk_name='user_id' AND target_pk_value=?)
        OR (? IS NOT NULL AND target_table='person' AND target_pk_name='person_id' AND target_pk_value=?)
      )
    ORDER BY submitted_at DESC, approval_id DESC
    LIMIT 1
    `,
    [userId, String(userId), personId, personId],
  );

  return (rows?.[0] as any) || null;
}

async function getPersonRow(conn: PoolConnection, personId: number) {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT * FROM person WHERE person_id=? LIMIT 1`,
    [personId],
  );
  return rows?.length ? { ...(rows[0] as any) } : null;
}

function urlToDiskPath(url: string) {
  const u = String(url || "").trim();
  if (!u.startsWith("/uploads/")) return null;
  if (u.includes("..")) return null;
  return path.join(process.cwd(), "public", u);
}

function buildChanges(proposed: any, snapshot: any, fallbackOld?: any): ChangeRow[] {
  // ถ้ามี proposed.changes มาแล้ว ใช้เลย
  if (Array.isArray(proposed?.changes)) {
    return proposed.changes
      .map((c: any) => ({
        key: safeString(c.key || ""),
        label: safeString(c.label || c.key || ""),
        old_value: safeString(c.old_value ?? c.old ?? "-") || "-",
        new_value: safeString(c.new_value ?? c.new ?? "-") || "-",
      }))
      .filter((c: ChangeRow) => c.key || c.label);
  }

  const setObj = extractSetObject(proposed);
  const baseOld = (snapshot && isObject(snapshot) ? snapshot : null) || null;

  const changes: ChangeRow[] = [];
  for (const [k, newVal] of Object.entries(setObj)) {
    const oldVal =
      (baseOld && baseOld[k] != null ? baseOld[k] : undefined) ??
      (fallbackOld && fallbackOld[k] != null ? fallbackOld[k] : undefined);

    changes.push({
      key: `person.${k}`,
      label: labelOfPersonKey(k),
      old_value: oldVal === undefined || oldVal === null || safeString(oldVal) === "" ? "-" : safeString(oldVal),
      new_value: newVal === undefined || newVal === null || safeString(newVal) === "" ? "-" : safeString(newVal),
    });
  }
  return changes;
}

/**
 * GET /api/admin/profile-approval?user_id=...
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;

  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get("user_id") || 0);
  if (!userId) return NextResponse.json({ message: "Missing user_id" }, { status: 400 });

  return withConn(async (conn) => {
    const row = await findLatestPendingApprovalForUser(conn, userId);
    if (!row) {
      return NextResponse.json({ approval: null, changes: [], attachments: [] });
    }

    const proposed = parseJsonField(row.proposed_data) || {};
    const snapshot = parseJsonField(row.current_snapshot) || null;

    // fallback old from DB
    let fallbackOld: any = null;
    if (row.target_table === "person" && row.target_pk_value) {
      fallbackOld = await getPersonRow(conn, Number(row.target_pk_value));
    } else {
      // fallback จาก users.person_id
      const [uRows] = await conn.query<RowDataPacket[]>(
        `SELECT person_id FROM users WHERE user_id=? LIMIT 1`,
        [userId],
      );
      const personId = uRows?.length && uRows[0].person_id != null ? Number(uRows[0].person_id) : null;
      if (personId) fallbackOld = await getPersonRow(conn, personId);
    }

    const changes = buildChanges(proposed, snapshot, fallbackOld);
    const attachments = extractAttachments(proposed);

    return NextResponse.json({
      approval: {
        ...row,
        proposed_data: proposed,
        current_snapshot: snapshot,
      },
      changes,
      attachments,
      debug: {
        proposed_keys: isObject(proposed) ? Object.keys(proposed).slice(0, 50) : [],
        extracted_set_keys: Object.keys(extractSetObject(proposed)).slice(0, 50),
      },
    });
  });
}

/**
 * POST /api/admin/profile-approval
 * body:
 *  - { approval_id, decision?: "approve"|"reject", reason?: string }
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;

  const body = await req.json().catch(() => ({} as any));
  const approvalId = Number(body?.approval_id || 0);
  const decision = (String(body?.decision || "approve") as any) === "reject" ? "reject" : "approve";
  const reason = String(body?.reason || "").trim() || null;

  if (!approvalId) {
    return NextResponse.json({ message: "ต้องระบุ approval_id ที่ถูกต้อง" }, { status: 400 });
  }

  return withConn(async (conn) => {
    // lock row
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM approval_request WHERE approval_id=? LIMIT 1 FOR UPDATE`,
      [approvalId],
    );
    if (!rows?.length) return NextResponse.json({ message: "ไม่พบคำขอนี้" }, { status: 404 });

    const appr: any = rows[0];
    const oldStatus: ApprovalStatus = appr.status;

    if (oldStatus !== "pending") {
      return NextResponse.json({ message: `คำขอนี้ไม่อยู่ในสถานะ pending (ตอนนี้: ${oldStatus})` }, { status: 400 });
    }

    const proposed = parseJsonField(appr.proposed_data) || {};
    const setObj = extractSetObject(proposed);

    if (appr.action === "update" && Object.keys(setObj).length === 0 && !Array.isArray(proposed?.changes)) {
      return NextResponse.json({ message: "proposed_data.set ว่าง (ไม่มีข้อมูลที่จะอัปเดต)" }, { status: 400 });
    }

    const newStatus: ApprovalStatus = decision === "approve" ? "approved" : "rejected";

    await conn.beginTransaction();
    try {
      // update approval_request
      await conn.query(
        `
        UPDATE approval_request
        SET status=?, reviewed_by=?, reviewed_at=NOW(), review_note=?
        WHERE approval_id=?
        `,
        [newStatus, admin.actorUserId || null, reason, approvalId],
      );

      // log ✅ ใช้ old_status/new_status ตาม schema
      await conn.query(
        `
        INSERT INTO approval_request_log (approval_id, old_status, new_status, actor_user_id, note, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        `,
        [approvalId, oldStatus, newStatus, admin.actorUserId || null, reason],
      );

      // ถ้า approve: apply to DB
      if (decision === "approve") {
        if (appr.target_table === "person" && appr.target_pk_name === "person_id") {
          const personId = Number(appr.target_pk_value || 0);
          if (!personId) throw new Error("approval target person_id ไม่ถูกต้อง");

          // apply set
          const cols = Object.keys(setObj);
          if (cols.length) {
            const sets = cols.map((c) => `\`${c}\`=?`).join(", ");
            const vals = cols.map((c) => (setObj as any)[c]);
            await conn.query(`UPDATE person SET ${sets} WHERE person_id=?`, [...vals, personId]);
          }

          // ✅ จัดการไฟล์: replace/delete ตาม meta
          const replaceUrl = safeString(proposed?.meta?.replace_url || "");
          const deleteUrl = safeString(proposed?.meta?.delete_url || "");

          for (const u of [replaceUrl, deleteUrl]) {
            if (!u) continue;
            const p = urlToDiskPath(u);
            if (!p) continue;
            try {
              await fs.unlink(p);
            } catch {
              // ignore
            }
          }
        } else {
          // ถ้าจะขยายตารางอื่น ๆ ค่อยเพิ่มที่นี่
          throw new Error(`ยังไม่รองรับ target_table: ${appr.target_table}`);
        }
      }

      await conn.commit();
      return NextResponse.json({ message: decision === "approve" ? "อนุมัติสำเร็จ" : "ตีกลับสำเร็จ" });
    } catch (e: any) {
      await conn.rollback();
      console.error(e);
      return NextResponse.json({ message: e?.message || "ดำเนินการไม่สำเร็จ" }, { status: 500 });
    }
  });
}
