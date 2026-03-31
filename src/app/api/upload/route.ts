import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { saveUploadFile } from "@/lib/upload/saveUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    const personIdRaw = form.get("person_id");
    const tabNameRaw = form.get("tab_name");
    const stageRaw = form.get("stage"); // "req" | "final"

    if (!file) return NextResponse.json({ message: "ไม่พบไฟล์" }, { status: 400 });
    if (!personIdRaw) return NextResponse.json({ message: "ไม่พบ person_id" }, { status: 400 });
    if (!tabNameRaw) return NextResponse.json({ message: "ไม่พบ tab_name" }, { status: 400 });

    const personId = Number(personIdRaw);
    if (!personId) return NextResponse.json({ message: "person_id ไม่ถูกต้อง" }, { status: 400 });

    const tabName = String(tabNameRaw || "unknown");
    const stage = String(stageRaw || "req") === "final" ? "final" : "req";

    const { url } = await saveUploadFile({ file, personId, tabName, stage });
    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: e?.message || "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}
