import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const userId = (session.user as any)?.user_id;
  if (!userId) {
    return { ok: false as const, status: 401, message: "Session missing user_id" };
  }

  return { ok: true as const, session, userId: Number(userId) };
}
