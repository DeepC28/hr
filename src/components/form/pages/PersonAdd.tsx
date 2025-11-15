"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: number | string; code?: string; name_th: string; name_en?: string };

type PersonForm = {
  prefix_name_id: string;
  first_name_th: string;
  last_name_th: string;
  gender_id: string;
  citizen_id: string;
  birth_date: string; // yyyy-mm-dd
  email: string;
  phone: string;
  department_id: string;
  staff_type_id: string;
  picture_url: string;
};

type OptionsPayload = {
  prefix_names: Option[];
  genders: Option[];
  departments: Option[];
  staff_types: Option[];
};

export default function PersonAdd() {
  const router = useRouter();

  const [opts, setOpts] = useState<OptionsPayload>({
    prefix_names: [],
    genders: [],
    departments: [],
    staff_types: [],
  });
  const [loadingOpts, setLoadingOpts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PersonForm>({
    prefix_name_id: "",
    first_name_th: "",
    last_name_th: "",
    gender_id: "",
    citizen_id: "",
    birth_date: "",
    email: "",
    phone: "",
    department_id: "",
    staff_type_id: "",
    picture_url: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingOpts(true);
        const res = await fetch("/api/person/options", { cache: "no-store" });
        if (!res.ok) throw new Error("โหลดตัวเลือกไม่สำเร็จ");
        const data: OptionsPayload = await res.json();
        if (!cancelled) setOpts(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "โหลดข้อมูลตัวเลือกผิดพลาด");
      } finally {
        if (!cancelled) setLoadingOpts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.first_name_th.trim() &&
      form.last_name_th.trim() &&
      form.gender_id &&
      form.department_id &&
      form.staff_type_id
    );
  }, [form]);

  const onChange = (k: keyof PersonForm, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("กรอกข้อมูลจำเป็นให้ครบก่อน");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/person/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "บันทึกไม่สำเร็จ");
      }
      const { person_id } = await res.json();
      router.push(`/person/edit/${person_id}`);
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== THEME-FRIENDLY STYLES =====
  const fieldLabel = "text-sm text-gray-700 dark:text-gray-300";

  const baseField =
    "w-full rounded-xl px-3 py-2 outline-none transition " +
    // bg/text for both themes
    "bg-white text-gray-900 placeholder-gray-400 " +
    "dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 " +
    // border in both themes
    "border border-gray-300 dark:border-gray-700 " +
    // focus ring
    "focus:border-transparent focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 " +
    // disabled
    "disabled:opacity-60 disabled:cursor-not-allowed";

  const inputClass = baseField;
  const selectClass = baseField + " appearance-none";
  const textareaClass = baseField + " resize-y";

  const buttonClass =
    "px-4 py-2 rounded-xl border transition " +
    "border-gray-300 dark:border-gray-700 " +
    "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 " +
    "hover:bg-gray-50 dark:hover:bg-gray-800 " +
    "focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 " +
    "disabled:opacity-60";

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {/* ตัด title ออก ตามที่ขอ (หัวข้ออยู่ไฟล์ที่หุ้มอยู่แล้ว) */}

      {/* แถวที่ 1: คำนำหน้า / ชื่อ / สกุล */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={fieldLabel}>คำนำหน้า</span>
          <select
            className={selectClass}
            value={form.prefix_name_id}
            onChange={(e) => onChange("prefix_name_id", e.target.value)}
            disabled={loadingOpts}
          >
            <option value="">— เลือก —</option>
            {opts.prefix_names.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name_th || o.name_en || o.code || o.id}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className={fieldLabel}>ชื่อ (TH)</span>
          <input
            className={inputClass}
            placeholder="ระบุชื่อ..."
            autoComplete="given-name"
            value={form.first_name_th}
            onChange={(e) => onChange("first_name_th", e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className={fieldLabel}>สกุล (TH)</span>
          <input
            className={inputClass}
            placeholder="ระบุสกุล..."
            autoComplete="family-name"
            value={form.last_name_th}
            onChange={(e) => onChange("last_name_th", e.target.value)}
          />
        </label>
      </div>

      {/* แถวที่ 2: เพศ / บัตร ปชช / วันเกิด */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={fieldLabel}>เพศ</span>
          <select
            className={selectClass}
            value={form.gender_id}
            onChange={(e) => onChange("gender_id", e.target.value)}
            disabled={loadingOpts}
          >
            <option value="">— เลือก —</option>
            {opts.genders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name_th || o.name_en || o.code || o.id}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className={fieldLabel}>เลขบัตรประชาชน</span>
          <input
            className={inputClass}
            inputMode="numeric"
            maxLength={13}
            placeholder="เช่น 1234567890123"
            value={form.citizen_id}
            onChange={(e) => onChange("citizen_id", e.target.value.replace(/\D/g, ""))}
          />
        </label>

        <label className="grid gap-1">
          <span className={fieldLabel}>วันเกิด</span>
          <input
            className={inputClass}
            type="date"
            value={form.birth_date}
            onChange={(e) => onChange("birth_date", e.target.value)}
          />
        </label>
      </div>

      {/* แถวที่ 3: Email / Phone / Picture URL */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={fieldLabel}>อีเมล</span>
          <input
            className={inputClass}
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className={fieldLabel}>โทรศัพท์</span>
          <input
            className={inputClass}
            inputMode="tel"
            placeholder="เช่น 0812345678"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className={fieldLabel}>รูปภาพ (URL)</span>
          <input
            className={inputClass}
            placeholder="https://..."
            value={form.picture_url}
            onChange={(e) => onChange("picture_url", e.target.value)}
          />
        </label>
      </div>

      {/* แถวที่ 4: หน่วยงาน / ประเภทบุคลากร */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className={fieldLabel}>หน่วยงาน</span>
          <select
            className={selectClass}
            value={form.department_id}
            onChange={(e) => onChange("department_id", e.target.value)}
            disabled={loadingOpts}
          >
            <option value="">— เลือก —</option>
            {opts.departments.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name_th || o.name_en || o.code || o.id}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className={fieldLabel}>ประเภทบุคลากร</span>
          <select
            className={selectClass}
            value={form.staff_type_id}
            onChange={(e) => onChange("staff_type_id", e.target.value)}
            disabled={loadingOpts}
          >
            <option value="">— เลือก —</option>
            {opts.staff_types.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name_th || o.name_en || o.code || o.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="text-sm text-red-500 dark:text-red-400">{error}</div>
      )}

      <div className="flex gap-2 items-center">
        <button
          className={buttonClass + " disabled:opacity-60"}
          type="submit"
          disabled={!canSubmit || submitting}
        >
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button
          className={buttonClass}
          type="button"
          onClick={() =>
            setForm({
              prefix_name_id: "",
              first_name_th: "",
              last_name_th: "",
              gender_id: "",
              citizen_id: "",
              birth_date: "",
              email: "",
              phone: "",
              department_id: "",
              staff_type_id: "",
              picture_url: "",
            })
          }
        >
          ล้าง
        </button>
      </div>
    </form>
  );
}
