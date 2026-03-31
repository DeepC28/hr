"use client";

import React, { useMemo, useRef, useState } from "react";

type UploadResult = {
  url: string;
  original_name: string;
  stored_name: string;
  owner_type: string;
  owner_id: string;
  bucket: string;
  mime: string;
  size_original: number;
  size_saved: number;
  optimized: boolean;
};

function isImageUrl(url: string) {
  const u = (url || "").toLowerCase();
  return (
    u.endsWith(".jpg") ||
    u.endsWith(".jpeg") ||
    u.endsWith(".png") ||
    u.endsWith(".webp") ||
    u.includes("image/")
  );
}

type Props = {
  label: string;

  // ลิงก์ (ภายนอก) — ไม่มี preview
  linkUrl: string;
  onChangeLinkUrl: (v: string) => void;

  // ไฟล์แนบในระบบ (local /uploads/...) — มี preview
  fileUrl: string;
  onChangeFileUrl: (v: string) => void;

  // ส่งไปให้ upload api เพื่อทำ folder ให้ชัด
  ownerType: string; // เช่น "person"
  ownerId: string; // เช่น person_id หรือ user_id
  bucket: string; // เช่น "license" | "training" | "penalty"
  accept?: string; // input accept
};

export default function LinkAndAttachmentField({
  label,
  linkUrl,
  onChangeLinkUrl,
  fileUrl,
  onChangeFileUrl,
  ownerType,
  ownerId,
  bucket,
  accept,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string>("");

  const hasLink = useMemo(() => !!(linkUrl || "").trim(), [linkUrl]);
  const hasFile = useMemo(() => !!(fileUrl || "").trim(), [fileUrl]);

  async function handlePickFile() {
    setErr("");
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErr("");
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      setUploading(true);

      const fd = new FormData();
      fd.append("file", f);
      fd.append("owner_type", ownerType);
      fd.append("owner_id", ownerId);
      fd.append("bucket", bucket);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        throw new Error(json?.message || "อัปโหลดไม่สำเร็จ");
      }

      const data = json as UploadResult;

      // ✅ อัปโหลดสำเร็จ -> เก็บเป็น fileUrl
      onChangeFileUrl(data.url);
    } catch (e: any) {
      setErr(e?.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function openUrl(url: string) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-slate-800">{label}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePickFile}
            disabled={uploading}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {uploading ? "กำลังอัปโหลด..." : "แนบไฟล์"}
          </button>

          {hasFile && (
            <button
              type="button"
              onClick={() => onChangeFileUrl("")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ลบไฟล์แนบ
            </button>
          )}
        </div>
      </div>

      {/* input hidden */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {err ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {/* ====== ช่องกรอกลิงก์ (ภายนอก) ====== */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          ลิงก์ (ถ้ามี)
        </label>
        <input
          type="url"
          value={linkUrl || ""}
          onChange={(e) => onChangeLinkUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
        {hasLink ? (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => openUrl(linkUrl)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              เปิดลิงก์
            </button>
            <div className="truncate text-xs text-slate-500">{linkUrl}</div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-500">
            * ถ้าใส่ลิงก์ จะ “ไม่ preview” ให้กดเปิดเอาเอง
          </div>
        )}
      </div>

      {/* ====== กล่องแสดงไฟล์แนบ (local) ====== */}
      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">
          ไฟล์แนบในระบบ (ถ้ามี)
        </div>

        {!hasFile ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            ยังไม่มีไฟล์แนบ
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800">
                  ไฟล์แนบ
                </div>
                <div className="truncate text-xs text-slate-500">{fileUrl}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openUrl(fileUrl)}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                >
                  เปิดไฟล์
                </button>
              </div>
            </div>

            {/* preview เฉพาะไฟล์แนบ */}
            {isImageUrl(fileUrl) ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
                <img
                  src={fileUrl}
                  alt="attachment-preview"
                  className="h-auto w-full object-contain"
                />
              </div>
            ) : (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                ไฟล์นี้ไม่ใช่รูปภาพ (ไม่มี preview) — กด “เปิดไฟล์” เพื่อดู
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
