// src/app/api/profile/file-delete-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { withConn } from "@/lib/mysql";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = Number((session.user as any)?.user_id ?? (session.user as any)?.id ?? 0);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const field = String(body?.field || "").trim(); // ex: "person.picture_url"
  const deleteUrl = String(body?.delete_url || "").trim();
  const reason = String(body?.reason_note || "").trim() || "ขอลบไฟล์";

  if (!field) return NextResponse.json({ message: "Missing field" }, { status: 400 });

  return withConn(async (conn) => {
    const [uRows] = await conn.query<RowDataPacket[]>(
      `SELECT user_id, person_id FROM users WHERE user_id=? LIMIT 1`,
      [userId],
    );
    if (!uRows?.length) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const personId = uRows[0].person_id != null ? Number(uRows[0].person_id) : null;
    if (!personId) return NextResponse.json({ message: "User has no person_id" }, { status: 400 });

    // snapshot
    const [pRows] = await conn.query<RowDataPacket[]>(
      `SELECT person_id, picture_url FROM person WHERE person_id=? LIMIT 1`,
      [personId],
    );
    const snapshot = pRows?.length ? { person_id: personId, picture_url: pRows[0].picture_url ?? null } : null;

    // set: ลบค่า (null)
    if (field !== "person.picture_url") {
      return NextResponse.json({ message: "Field not supported (ตอนนี้รองรับ person.picture_url)" }, { status: 400 });
    }

    const proposed_data = {
      set: { picture_url: null },
      meta: { delete_url: deleteUrl || null },
      attachments: deleteUrl
        ? [{ label: "ไฟล์ที่ขอลบ", url: deleteUrl, section: "delete", kind: "other" }]
        : [],
    };

    const [ins]: any = await conn.query(
      `
      INSERT INTO approval_request
        (target_table, target_pk_name, target_pk_value, action, proposed_data, current_snapshot, reason_note, status, submitted_by)
      VALUES
        ('person', 'person_id', ?, 'update', ?, ?, ?, 'pending', ?)
      `,
      [
        String(personId),
        JSON.stringify(proposed_data),
        snapshot ? JSON.stringify(snapshot) : null,
        reason,
        userId,
      ],
    );

    return NextResponse.json({
      message: "ส่งคำขอลบไฟล์เรียบร้อย (รอผู้ดูแลอนุมัติ)",
      approval_id: Number(ins?.insertId || 0),
    });
  });
}
