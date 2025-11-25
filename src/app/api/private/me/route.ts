import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbQuery } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  // @ts-ignore
  const sessionToken = token.sessionToken;
  // @ts-ignore
  const userId = Number(token.id);
  if (!sessionToken || !userId)
    return new NextResponse("Unauthorized", { status: 401 });

  const [sessions] = await dbQuery<any>(
    `
    SELECT session_id
    FROM user_session
    WHERE user_id = ?
      AND session_token = ?
      AND is_active = 1
      AND logout_at IS NULL
    LIMIT 1
  `,
    [userId, sessionToken]
  );

  if (!sessions[0]) {
    return new NextResponse("Session expired", { status: 401 });
  }

  await dbQuery(
    `
    UPDATE user_session
    SET last_seen_at = NOW()
    WHERE user_id = ?
      AND session_token = ?
  `,
    [userId, sessionToken]
  );

  const [users] = await dbQuery<any>(
    "SELECT user_id, username, status FROM users WHERE user_id = ? LIMIT 1",
    [userId]
  );
  const user = users[0];

  return NextResponse.json({
    id: user.user_id,
    username: user.username,
    status: user.status,
  });
}
