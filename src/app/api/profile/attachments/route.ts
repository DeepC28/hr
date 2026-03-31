// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

export const runtime = "nodejs";

function safeSegment(v: string, fallback = "unknown") {
  const s = String(v || "").trim();
  if (!s) return fallback;
  return s.replace(/[^\w.\-]+/g, "_") || fallback;
}

function safeBaseFileName(name: string) {
  const base = (name || "file").split(/[\\/]/).pop() || "file";
  return base.replace(/[^\w.\-()]+/g, "_");
}

function getStamp() {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  );
}

function isImageMime(mime: string) {
  return typeof mime === "string" && mime.startsWith("image/");
}

async function tryOptimizeImage(
  input: Buffer,
  mime: string,
): Promise<{ buffer: Buffer; ext: string; optimized: boolean }> {
  let sharpMod: any = null;
  try {
    sharpMod = (await import("sharp")).default;
  } catch {
    return { buffer: input, ext: "", optimized: false };
  }

  try {
    const sharp = sharpMod;
    let img = sharp(input, { failOnError: false }).rotate();
    const meta = await img.metadata();

    const maxW = 1920;
    const maxH = 1920;

    if (meta && (typeof meta.width === "number" || typeof meta.height === "number")) {
      const w = meta.width || 0;
      const h = meta.height || 0;
      if (w > maxW || h > maxH) {
        img = img.resize({ width: maxW, height: maxH, fit: "inside", withoutEnlargement: true });
      }
    }

    if (mime === "image/jpeg" || mime === "image/jpg") {
      const out = await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      return { buffer: out, ext: "jpg", optimized: true };
    }
    if (mime === "image/png") {
      const out = await img.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
      return { buffer: out, ext: "png", optimized: true };
    }
    if (mime === "image/webp") {
      const out = await img.webp({ quality: 82 }).toBuffer();
      return { buffer: out, ext: "webp", optimized: true };
    }

    return { buffer: input, ext: "", optimized: false };
  } catch {
    return { buffer: input, ext: "", optimized: false };
  }
}

function requireField(form: FormData, key: string) {
  const v = String(form.get(key) || "").trim();
  if (!v) throw new Error(`Missing field: ${key}`);
  return v;
}

function urlToDiskPath(url: string) {
  // จำกัดเฉพาะ /uploads/... เท่านั้น กันลบไฟล์มั่ว
  const u = String(url || "").trim();
  if (!u.startsWith("/uploads/")) return null;
  if (u.includes("..")) return null;

  const full = path.join(process.cwd(), "public", u); // public + /uploads/...
  return full;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "กรุณาแนบไฟล์ (field: file)" }, { status: 400 });
    }

    // ✅ ต้องส่งมาจาก client
    const owner_type = safeSegment(requireField(form, "owner_type")); // user | person
    const owner_key = safeSegment(requireField(form, "owner_key"));   // username หรือ person_id
    const bucket = safeSegment(requireField(form, "bucket"));         // license | training | penalty | profile | ...
    const slot = safeSegment(requireField(form, "slot"));             // picture_url | license:12 | training:55 | ...
    const replace_url = String(form.get("replace_url") || "").trim(); // optional

    // จำกัดขนาด
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ message: "ไฟล์ใหญ่เกินกำหนด (สูงสุด 15MB)" }, { status: 400 });
    }

    // ✅ ถ้ามี replace_url: ลบก่อน (ภายใน uploads เท่านั้น)
    if (replace_url) {
      const oldPath = urlToDiskPath(replace_url);
      if (oldPath) {
        try {
          await fs.unlink(oldPath);
        } catch {
          // ไม่เป็นไร ไฟล์อาจไม่มีแล้ว
        }
      }
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const baseDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      bucket,
      owner_type,
      owner_key,
      slot,
      yyyy,
      mm,
    );
    await fs.mkdir(baseDir, { recursive: true });

    const original = safeBaseFileName(file.name);
    const extFromName = path.extname(original).toLowerCase();
    const baseNoExt = original.replace(extFromName, "");
    const stamp = getStamp();
    const uuid = crypto.randomUUID();
    let finalExt = extFromName || "";

    let outBuffer = inputBuffer;
    let optimized = false;

    if (isImageMime(file.type)) {
      const opt = await tryOptimizeImage(inputBuffer, file.type);
      outBuffer = opt.buffer;
      optimized = opt.optimized;
      if (!finalExt && opt.ext) finalExt = "." + opt.ext;
    }

    if (!finalExt) finalExt = ".bin";

    const storedName = `${stamp}_${uuid}_${baseNoExt}${finalExt}`;
    const fullpath = path.join(baseDir, storedName);

    await fs.writeFile(fullpath, outBuffer);

    const url = `/uploads/${bucket}/${owner_type}/${owner_key}/${slot}/${yyyy}/${mm}/${storedName}`;

    return NextResponse.json({
      url,
      original_name: file.name,
      stored_name: storedName,
      owner_type,
      owner_key,
      bucket,
      slot,
      mime: file.type,
      size_original: file.size,
      size_saved: outBuffer.length,
      optimized,
      replaced: !!replace_url,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: err?.message || "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}
