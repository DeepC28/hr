"use client";

import { useRef, useState } from "react";

type Patch = {
  file_url?: string;
  file_upload_url?: string | null;
  file_upload_name?: string | null;
};

type Props = {
  disabled: boolean;

  personId: number | null;
  tabName: string; // ใช้ทำ path upload/{personId}/{tabName}/...

  // req = รออนุมัติ, final = ตัวจริง
  stage?: "req" | "final";

  fileUrl: string;
  fileUploadUrl: string | null;
  fileUploadName: string | null;

  onChange: (patch: Patch) => void;

  label?: string;
  fieldClass?: string;
};

export default function AttachmentField({
  disabled,
  personId,
  tabName,
  stage = "req",
  fileUrl,
  fileUploadUrl,
  fileUploadName,
  onChange,
  label = "ไฟล์แนบ",
  fieldClass,
}: Props) {
  const inputClass =
    fieldClass ??
    "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
      "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
      "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

  const labelClass = "text-[11px] font-medium text-gray-600 dark:text-gray-300";
  const btnClass =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium " +
    "bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100";

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setErr(null);

    if (!personId) {
      setErr("ยังไม่มี person_id (โปรดให้ระบบมีข้อมูลบุคคลก่อน)");
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("person_id", String(personId));
      fd.append("tab_name", tabName);
      fd.append("stage", stage);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.message || "อัปโหลดไฟล์ไม่สำเร็จ");

      const url = String(data?.url || "");
      if (!url) throw new Error("ระบบไม่ส่ง url กลับมา");

      onChange({
        file_upload_url: url,
        file_upload_name: file.name,
      });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "อัปโหลดไฟล์ไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>

      <div className="flex items-center gap-2">
        <input
          className={inputClass}
          disabled={disabled}
          value={fileUrl ?? ""}
          onChange={(e) => onChange({ file_url: e.target.value })}
          placeholder="วางลิงก์ไฟล์ (ถ้ามี)"
        />

        <label className={`${btnClass} whitespace-nowrap ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
          {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
        </label>
      </div>

      {(fileUploadUrl || fileUrl) && (
        <div className="text-[11px]">
          {fileUploadUrl && (
            <>
              <a
                href={fileUploadUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline dark:text-indigo-300"
              >
                เปิดไฟล์ที่อัปโหลด{fileUploadName ? ` (${fileUploadName})` : ""}
              </a>
              {!disabled && (
                <button
                  type="button"
                  className="ml-3 text-[11px] text-red-500 hover:underline"
                  onClick={() => onChange({ file_upload_url: null, file_upload_name: null })}
                >
                  ลบไฟล์อัปโหลด
                </button>
              )}
            </>
          )}

          {!fileUploadUrl && fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline dark:text-indigo-300"
            >
              เปิดลิงก์
            </a>
          )}
        </div>
      )}

      {err && <div className="text-[11px] text-red-600 dark:text-red-400">{err}</div>}
    </div>
  );
}
