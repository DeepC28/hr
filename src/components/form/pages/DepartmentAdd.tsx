"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// --- theme helpers for Swal ---
function isDark() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}
async function swalSuccess(text: string) {
  const dark = isDark();
  return Swal.fire({
    title: "สำเร็จ",
    text,
    icon: "success",
    timer: 1300,
    showConfirmButton: false,
    background: dark ? "#0b0f19" : "#ffffff",
    color: dark ? "#e5e7eb" : "#111827",
  });
}
async function swalError(text: string) {
  const dark = isDark();
  return Swal.fire({
    title: "กรอกข้อมูลไม่ครบ",
    text,
    icon: "error",
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#465fff",
    background: dark ? "#0b0f19" : "#ffffff",
    color: dark ? "#e5e7eb" : "#111827",
  });
}

// --- types ---
type NewDepartment = {
  code: string;
  name_th: string;
  name_en?: string;
  parent_id?: number | null;
  level_no?: number | null; // 1-5
};

// ตัวอย่างรายการหน่วยงานแม่ (ควรโหลดจาก API จริง)
const PARENT_OPTIONS: { id: number; label: string }[] = [
  { id: 1, label: "คณะวิทยาศาสตร์" },
  { id: 2, label: "คณะวิศวกรรมศาสตร์" },
  { id: 3, label: "กองกลาง" },
];

export default function DepartmentAdd() {
  const router = useRouter();

  const [form, setForm] = useState<NewDepartment>({
    code: "",
    name_th: "",
    name_en: "",
    parent_id: undefined,
    level_no: undefined,
  });
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return form.code.trim() !== "" && form.name_th.trim() !== "" && !!form.level_no;
  }, [form]);

  function update<K extends keyof NewDepartment>(key: K, val: NewDepartment[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      await swalError("กรุณากรอก 'โค้ด', 'ชื่อ (TH)' และ 'ระดับชั้น'");
      return;
    }

    try {
      setSaving(true);
      // TODO: เรียก API จริง
      await new Promise((r) => setTimeout(r, 600));
      await swalSuccess("บันทึกหน่วยงานเรียบร้อย");
      router.push("/department");
    } catch (err) {
      await swalError("บันทึกล้มเหลว กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setForm({
      code: "",
      name_th: "",
      name_en: "",
      parent_id: undefined,
      level_no: undefined,
    });
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit} onReset={onReset}>
      {/* (ลบ title ออกแล้ว) */}

      {/* code */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-600 dark:text-white/70">
          โค้ด <span className="text-error-500">*</span>
        </span>
        <input
          value={form.code}
          onChange={(e) => update("code", e.target.value)}
          className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-gray-900 placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400
                     dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700"
          placeholder="เช่น FAC-SCI, DEP-001"
        />
      </label>

      {/* name_th */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-600 dark:text-white/70">
          ชื่อ (TH) <span className="text-error-500">*</span>
        </span>
        <input
          value={form.name_th}
          onChange={(e) => update("name_th", e.target.value)}
          className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-gray-900 placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400
                     dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700"
          placeholder="เช่น คณะวิทยาศาสตร์ / ภาควิชาชีววิทยา"
        />
      </label>

      {/* name_en */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-600 dark:text-white/70">ชื่อ (EN)</span>
        <input
          value={form.name_en}
          onChange={(e) => update("name_en", e.target.value)}
          className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-gray-900 placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400
                     dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700"
          placeholder="e.g. Faculty of Science / Department of Biology"
        />
      </label>

      {/* parent_id */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-600 dark:text-white/70">หน่วยงานแม่ (ถ้ามี)</span>
        <div className="relative">
          <select
            value={form.parent_id ?? ""}
            onChange={(e) => update("parent_id", e.target.value === "" ? undefined : Number(e.target.value))}
            className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 pr-10 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400
                       dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-700"
          >
            <option className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white/90" value="">
              — ไม่มี —
            </option>
            {PARENT_OPTIONS.map((p) => (
              <option
                key={p.id}
                value={p.id}
                className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white/90"
              >
                {p.label}
              </option>
            ))}
          </select>
          {/* chevron */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-white/40">
          ถ้าเป็น “ระดับบนสุด” ให้เลือก “ไม่มี”
        </span>
      </label>

      {/* level_no */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-600 dark:text-white/70">
          ระดับชั้น (1–5) <span className="text-error-500">*</span>
        </span>
        <div className="relative">
          <select
            value={form.level_no ?? ""}
            onChange={(e) => update("level_no", e.target.value === "" ? undefined : Number(e.target.value))}
            className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 pr-10 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400
                       dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-700"
          >
            <option className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white/90" value="">
              — เลือกระดับ —
            </option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option
                key={n}
                value={n}
                className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white/90"
              >
                {n}
              </option>
            ))}
          </select>
          {/* chevron */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-white/40">
          ใช้ตรวจสอบเงื่อนไข <code>CHECK(level_no between 1 and 5)</code>
        </span>
      </label>

      {/* actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="h-11 px-4 rounded-xl border border-brand-500 bg-brand-500 text-white text-sm font-medium
                     hover:bg-brand-600 disabled:opacity-60
                     dark:border-brand-400 dark:bg-brand-400 dark:text-gray-900 dark:hover:bg-brand-300"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>

        <button
          type="reset"
          disabled={saving}
          className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 hover:bg-gray-50
                     dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:hover:bg-gray-800"
        >
          ล้าง
        </button>

        <button
          type="button"
          onClick={() => router.push("/department")}
          disabled={saving}
          className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 hover:bg-gray-50
                     dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:hover:bg-gray-800"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
