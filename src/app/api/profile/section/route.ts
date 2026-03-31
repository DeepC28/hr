// src/app/api/profile/section/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbQuery } from "@/lib/db";

const ALLOWED_SECTIONS = [
  "general",
  "address",
  "employment",
  "education",
  "licenses",
  "movements",
  "trainings",
  "decorations",
  "passports",
  "penalties",
  "researcher",
  "scholar-orders",
  "departments",
] as const;

type AllowedSection = (typeof ALLOWED_SECTIONS)[number];

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const anyUser = session.user as any;
    const email: string | null = anyUser?.email ?? null;
    const username: string | null =
      anyUser?.username ?? anyUser?.name ?? null;

    if (!email && !username) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลผู้ใช้ใน session" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { message: "รูปแบบข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { section, payload } = body as {
      section?: string;
      payload?: any;
    };

    if (!section || !ALLOWED_SECTIONS.includes(section as AllowedSection)) {
      return NextResponse.json(
        { message: "section ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    // ===== หา user + person_id =====
    const [userRows] = await dbQuery<any[]>(
      `
      SELECT u.user_id, u.person_id
      FROM users u
      WHERE
        (u.email = ? AND ? IS NOT NULL)
        OR (u.username = ? AND ? IS NOT NULL)
      LIMIT 1
    `,
      [email, email, username, username],
    );

    const userRow = userRows[0] || null;

    if (!userRow) {
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้ในระบบ HR" },
        { status: 404 },
      );
    }

    const userId: number = userRow.user_id;
    const personId: number | null = userRow.person_id ?? null;

    if (!personId) {
      return NextResponse.json(
        {
          message:
            "ยังไม่ได้เชื่อมข้อมูลบุคลากรในระบบ HR ไม่สามารถส่งคำขอแก้ไขได้",
        },
        { status: 400 },
      );
    }

    // ===== เช็คว่ามี pending อยู่แล้วไหม =====
    const [pendingRows] = await dbQuery<any[]>(
      `
      SELECT approval_id, status
      FROM approval_request
      WHERE target_table = 'person'
        AND target_pk_name = 'person_id'
        AND target_pk_value = ?
        AND submitted_by = ?
        AND status = 'pending'
      LIMIT 1
    `,
      [String(personId), userId],
    );

    if (pendingRows.length > 0) {
      return NextResponse.json(
        {
          message:
            "ขณะนี้มีคำขอที่กำลังรอผู้ดูแลระบบอนุมัติอยู่ กรุณารอให้ดำเนินการเสร็จก่อน",
        },
        { status: 400 },
      );
    }

    const proposedData = {
      section,
      payload,
    };

    // บันทึกเป็น approval_request (action = update)
    await dbQuery(
      `
      INSERT INTO approval_request (
        target_table,
        target_pk_name,
        target_pk_value,
        action,
        proposed_data,
        current_snapshot,
        reason_note,
        status,
        submitted_by
      ) VALUES (
        'person',
        'person_id',
        ?,
        'update',
        ?,
        NULL,
        NULL,
        'pending',
        ?
      )
    `,
      [String(personId), JSON.stringify(proposedData), userId],
    );

    return NextResponse.json({
      message:
        "ส่งคำขออัปเดตข้อมูลส่วนนี้เรียบร้อยแล้ว กรุณารอผู้ดูแลระบบตรวจสอบ",
      status: "pending",
    });
  } catch (err: any) {
    console.error("POST /api/profile/section error:", err);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการบันทึกคำขอ" },
      { status: 500 },
    );
  }
}
