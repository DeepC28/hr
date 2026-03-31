// src/app/api/profile/me/route.ts
import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = Number((session.user as any)?.user_id ?? (session.user as any)?.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ message: "Session missing user_id" }, { status: 400 });
  }

  try {
    const [uRows] = await dbQuery<any[]>(
      "SELECT user_id, username, email, person_id FROM users WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (!uRows?.length) {
      return NextResponse.json({ message: "user_not_found" }, { status: 404 });
    }

    const user = uRows[0];

    let person: any = null;
    if (user.person_id) {
      const [pRows] = await dbQuery<any[]>(
        `
        SELECT
          person_id, citizen_id, prefix_id, first_name_th, last_name_th,
          telephone, email, birthday, gender_id, nationality_id, stafftype_id
        FROM person
        WHERE person_id = ?
        LIMIT 1
        `,
        [user.person_id],
      );
      person = pRows?.[0] ?? null;
    }

    return NextResponse.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        person_id: user.person_id,
      },
      person,
    });
  } catch (err: any) {
    console.error("GET /api/profile/me error:", err);
    return NextResponse.json({ message: "db_error" }, { status: 500 });
  }
}
