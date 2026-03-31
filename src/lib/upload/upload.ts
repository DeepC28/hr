import path from "path";
import crypto from "crypto";
import fs from "fs/promises";

function safeSegment(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export function getUploadRoot(): string {
  return process.env.UPLOAD_ROOT || "./public/upload";
}

export function allowedExt(filename: string): boolean {
  const allowed = (process.env.UPLOAD_ALLOWED_EXT || "pdf,jpg,jpeg,png")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const ext = path.extname(filename).replace(".", "").toLowerCase();
  return allowed.includes(ext);
}

export function maxBytes(): number {
  const mb = Number(process.env.UPLOAD_MAX_MB ?? 20);
  return Math.max(1, mb) * 1024 * 1024;
}

export async function saveUploadedFile(opts: {
  tab: string;
  userId: string | number;
  folder: "none_approve" | "approved";
  file: File;
}): Promise<{ publicUrl: string; diskPath: string; originalName: string }>{
  const tab = safeSegment(String(opts.tab));
  const userId = safeSegment(String(opts.userId));
  const folder = safeSegment(String(opts.folder));

  const originalName = opts.file.name || "file";
  const base = safeSegment(path.basename(originalName));

  if (!allowedExt(base)) {
    throw new Error("File type not allowed");
  }

  const buf = Buffer.from(await opts.file.arrayBuffer());
  if (buf.byteLength > maxBytes()) {
    throw new Error("File too large");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = crypto.randomBytes(6).toString("hex");
  const finalName = `${stamp}_${rand}_${base}`;

  const root = getUploadRoot();
  const relDir = path.posix.join(tab, userId, folder);
  const absDir = path.resolve(root, relDir);
  await fs.mkdir(absDir, { recursive: true });

  const absFile = path.resolve(absDir, finalName);
  await fs.writeFile(absFile, buf);

  // ถ้า UPLOAD_ROOT เป็น ./public/upload => publicUrl จะเป็น /upload/...
  const publicUrl = "/upload/" + path.posix.join(relDir, finalName);

  return { publicUrl, diskPath: absFile, originalName };
}