// src/lib/upload-client.ts
export type UploadMeta = {
  owner_type: "person" | "user" | "username" | string;
  owner_id: string | number;
  bucket: string; // เช่น "license" | "training" | "penalty" | "profile"
  replace?: boolean; // true = ลบไฟล์เก่าในโฟลเดอร์เดียวกันก่อน
};

export async function uploadFile(file: File, meta: UploadMeta) {
  const fd = new FormData();
  fd.append("file", file);

  fd.append("owner_type", String(meta.owner_type || "unknown"));
  fd.append("owner_id", String(meta.owner_id || "unknown"));
  fd.append("bucket", String(meta.bucket || "misc"));
  fd.append("replace", meta.replace ? "1" : "0");

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data as {
    url: string;
    stored_name: string;
    original_name: string;
    owner_type: string;
    owner_id: string;
    bucket: string;
    replaced_old: boolean;
  };
}
