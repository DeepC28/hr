// src/lib/file-storage.ts
import path from "path";
import { promises as fs } from "fs";

export function safeSegment(v: string, fallback = "unknown") {
  const s = String(v || "").trim();
  if (!s) return fallback;
  const cleaned = s.replace(/[^\w.\-]+/g, "_");
  return cleaned || fallback;
}

export function safeBaseFileName(name: string) {
  const base = (name || "file").split(/[\\/]/).pop() || "file";
  return base.replace(/[^\w.\-()]+/g, "_");
}

export function isImageMime(mime: string) {
  return typeof mime === "string" && mime.startsWith("image/");
}

export function guessKindFromUrl(url: string): "pdf" | "image" | "other" {
  const u = (url || "").toLowerCase();
  if (u.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "image";
  if (u.match(/\.pdf($|\?)/)) return "pdf";
  return "other";
}

/**
 * แปลง public url (/uploads/...) -> absolute path ในโปรเจค
 * และกัน path traversal
 */
export function publicUrlToAbsPath(publicUrl: string) {
  const u = String(publicUrl || "").trim();
  if (!u.startsWith("/uploads/")) throw new Error("Not a supported upload url");

  const rel = u.replace(/^\/+/, ""); // remove leading /
  const abs = path.join(process.cwd(), "public", rel);

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const norm = path.normalize(abs);

  if (!norm.startsWith(uploadsRoot)) {
    throw new Error("Invalid path (outside uploads)");
  }
  return norm;
}

export async function deleteFileByPublicUrl(publicUrl: string) {
  const abs = publicUrlToAbsPath(publicUrl);
  try {
    await fs.unlink(abs);
    return { ok: true };
  } catch (e: any) {
    // ถ้าไฟล์ไม่มีแล้วก็ไม่ถือว่าพัง
    if (e?.code === "ENOENT") return { ok: true, missing: true };
    throw e;
  }
}
