// src/lib/authUser.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export function pickUserIdFromSession(session: any): number | null {
  const raw = session?.user?.id;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}
