import fs from "fs/promises";
import path from "path";

function sanitizeFilename(name: string) {
  const base = path.basename(name);
  return base.replace(/[^\w.\-() ]+/g, "_");
}

export async function saveUploadFile(params: {
  file: File;
  personId: number;
  tabName: string;
  stage?: "req" | "final";
}) {
  const { file, personId, tabName, stage = "req" } = params;

  const safeTab = String(tabName || "unknown").replace(/[^\w.\-]+/g, "_");
  const safeName = sanitizeFilename((file as any).name || "file");
  const stamp = Date.now();
  const finalName = `${stamp}-${safeName}`;

  const relDir =
    stage === "req"
      ? path.join("upload", String(personId), safeTab, "req")
      : path.join("upload", String(personId), safeTab);

  const absDir = path.join(process.cwd(), "public", relDir);
  await fs.mkdir(absDir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  const absPath = path.join(absDir, finalName);

  await fs.writeFile(absPath, buf);

  const url = "/" + path.join(relDir, finalName).replaceAll("\\", "/");
  return { url, filename: finalName };
}
