// src/lib/auth-server.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// กัน TS ชอบมองเป็น unknown
export async function getServerAuthSession(): Promise<any> {
  return (await getServerSession(authOptions as any)) as any;
}
