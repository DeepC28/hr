import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { getSubdistricts } from "@/lib/address/getSubdistricts";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  try {
    const items = await getSubdistricts();
    return NextResponse.json({ items });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: e?.message || "โหลดตำบลไม่สำเร็จ" }, { status: 500 });
  }
}
