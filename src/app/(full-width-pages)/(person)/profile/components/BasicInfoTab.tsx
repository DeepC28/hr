"use client";

import type { PersonForm, LookupOptions } from "../ProfileClient";
import ThaiDateInput from "./ThaiDateInput";
import { useRef, useState } from "react";

type Props = {
  person: PersonForm;
  onChange: (next: PersonForm) => void;
  options: LookupOptions;
  disabled: boolean;
};

export default function BasicInfoTab({ person, onChange, options, disabled }: Props) {
  const set = <K extends keyof PersonForm>(key: K, value: PersonForm[K]) => onChange({ ...person, [key]: value });

  const field =
    "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-[11px] font-medium text-gray-600 dark:text-gray-300";

  const picRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [picErr, setPicErr] = useState<string | null>(null);

  const uploadPicture = async (file: File) => {
    setPicErr(null);

    if (!person.person_id) {
      setPicErr("ยังไม่มี person_id (โปรดให้ระบบมีข้อมูลบุคคลก่อน)");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("person_id", String(person.person_id));
      fd.append("tab_name", "basic");
      fd.append("stage", "req");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "อัปโหลดรูปไม่สำเร็จ");

      const url = String(data?.url || "");
      if (!url) throw new Error("ระบบไม่ส่ง url กลับมา");
      set("picture_url", url);
    } catch (e: any) {
      console.error(e);
      setPicErr(e?.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (picRef.current) picRef.current.value = "";
    }
  };

  const picBtn =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium " +
    "bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100";

  return (
    <div className="space-y-4 text-xs">
      <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
            {person.picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.picture_url} alt="profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-400">ไม่มีรูป</div>
            )}
          </div>

          <div className="flex-1">
            <label className={label}>รูปโปรไฟล์ (ลิงก์)</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                className={field}
                disabled={disabled}
                value={person.picture_url ?? ""}
                onChange={(e) => set("picture_url", e.target.value || null)}
              />

              <label className={`${picBtn} whitespace-nowrap ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
                {uploading ? "กำลังอัปโหลด..." : "แนบรูป"}
                <input
                  ref={picRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={disabled || uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPicture(f);
                  }}
                />
              </label>
            </div>

            {person.picture_url && (
              <div className="mt-1 text-[11px]">
                <a href={person.picture_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-300">
                  เปิดรูป
                </a>
                {!disabled && (
                  <button type="button" className="ml-3 text-[11px] text-red-500 hover:underline" onClick={() => set("picture_url", null)}>
                    ลบรูป
                  </button>
                )}
              </div>
            )}

            {picErr && <div className="mt-1 text-[11px] text-red-600 dark:text-red-400">{picErr}</div>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className={label}>คำนำหน้า</label>
          <select
            className={field}
            disabled={disabled}
            value={person.prefix_id ?? ""}
            onChange={(e) => set("prefix_id", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">- เลือก -</option>
            {options.prefixes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name_th}
                {p.name_en ? ` (${p.name_en})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>ชื่อ (ไทย)</label>
          <input className={field} disabled={disabled} value={person.first_name_th} onChange={(e) => set("first_name_th", e.target.value)} />
        </div>
        <div>
          <label className={label}>สกุล (ไทย)</label>
          <input className={field} disabled={disabled} value={person.last_name_th} onChange={(e) => set("last_name_th", e.target.value)} />
        </div>
        <div>
          <label className={label}>สถานะ / หมายเหตุ</label>
          <input className={field} disabled={disabled} value={person.status_text ?? ""} onChange={(e) => set("status_text", e.target.value || null)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div />
        <div>
          <label className={label}>ชื่อ (อังกฤษ)</label>
          <input className={field} disabled={disabled} value={person.first_name_en ?? ""} onChange={(e) => set("first_name_en", e.target.value || null)} />
        </div>
        <div>
          <label className={label}>สกุล (อังกฤษ)</label>
          <input className={field} disabled={disabled} value={person.last_name_en ?? ""} onChange={(e) => set("last_name_en", e.target.value || null)} />
        </div>
        <div />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className={label}>เลขบัตรประชาชน</label>
          <input className={field} disabled={disabled} value={person.citizen_id ?? ""} onChange={(e) => set("citizen_id", e.target.value || null)} />
        </div>
        <div>
          <label className={label}>วันเกิด</label>
          <ThaiDateInput value={person.birthday} onChange={(val) => set("birthday", val)} disabled={disabled} className={field} />
        </div>
        <div>
          <label className={label}>เพศ</label>
          <select className={field} disabled={disabled} value={person.gender_id ?? ""} onChange={(e) => set("gender_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกเพศ -</option>
            {options.genders.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name_th}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>สัญชาติ</label>
          <select className={field} disabled={disabled} value={person.nationality_id ?? ""} onChange={(e) => set("nationality_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกสัญชาติ -</option>
            {options.nationalities.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name_th}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={label}>เบอร์โทรศัพท์</label>
          <input className={field} disabled={disabled} value={person.telephone ?? ""} onChange={(e) => set("telephone", e.target.value || null)} />
        </div>
        <div className="md:col-span-2">
          <label className={label}>อีเมลติดต่อ</label>
          <input className={field} disabled={disabled} value={person.email ?? ""} onChange={(e) => set("email", e.target.value || null)} />
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-gray-200 pt-4 dark:border-gray-700">
        <div className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-200">ข้อมูลหนังสือเดินทาง (ถ้ามี)</div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={label}>เลขที่หนังสือเดินทาง</label>
            <input className={field} disabled={disabled} value={person.passport_no ?? ""} onChange={(e) => set("passport_no", e.target.value || null)} />
          </div>
          <div>
            <label className={label}>วันออกหนังสือเดินทาง</label>
            <ThaiDateInput value={person.passport_issued_date} onChange={(val) => set("passport_issued_date", val)} disabled={disabled} className={field} />
          </div>
          <div>
            <label className={label}>วันหมดอายุหนังสือเดินทาง</label>
            <ThaiDateInput value={person.passport_expiry_date} onChange={(val) => set("passport_expiry_date", val)} disabled={disabled} className={field} />
          </div>
        </div>
      </div>
    </div>
  );
}
