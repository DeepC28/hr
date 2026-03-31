"use client";

import type { EducationForm, LookupOptions } from "../ProfileClient";
import ThaiDateInput from "./ThaiDateInput";

type Props = {
  items: EducationForm[];
  onChange: (next: EducationForm[]) => void;
  options: LookupOptions;
  disabled: boolean;
};

const emptyEdu = (): EducationForm => ({
  education_id: null,
  grad_lev_id: null,

  degree_id: null,
  major_id: null,
  institution_id: null,

  degree_name: "",
  major_name: "",
  university_name: "",

  country_id: null,
  grad_date: null,
});

export default function EducationTab({ items, onChange, options, disabled }: Props) {
  const field =
    "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-[11px] font-medium text-gray-600 dark:text-gray-300";
  const btn =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium " +
    "bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100";

  const degrees = options?.eduDegrees ?? [];
  const majors = options?.eduMajors ?? [];
  const insts = options?.eduInstitutions ?? [];

  const updateItem = (idx: number, patch: Partial<EducationForm>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, emptyEdu()]);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-200">ประวัติการศึกษา</div>
        <button type="button" disabled={disabled} onClick={addItem} className={`${btn} disabled:opacity-60`}>
          + เพิ่มวุฒิการศึกษา
        </button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-3 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
          ยังไม่มีข้อมูลการศึกษา {!disabled && "กด “เพิ่มวุฒิการศึกษา” เพื่อเพิ่มรายการแรก"}
        </div>
      )}

      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">วุฒิการศึกษาที่ {idx + 1}</div>
              <button type="button" disabled={disabled} onClick={() => removeItem(idx)} className="text-[11px] text-red-500 hover:underline disabled:opacity-50">
                ลบรายการนี้
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className={label}>ระดับการศึกษา</label>
                <select className={field} disabled={disabled} value={it.grad_lev_id ?? ""} onChange={(e) => updateItem(idx, { grad_lev_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">- เลือก -</option>
                  {options.gradLevels.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name_th}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={label}>ชื่อวุฒิ / ปริญญา</label>
                <select
                  className={field}
                  disabled={disabled}
                  value={it.degree_id ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    const found = id ? degrees.find((d) => d.id === id) : null;
                    updateItem(idx, { degree_id: id, degree_name: found?.name_th ?? "" });
                  }}
                >
                  <option value="">- เลือกวุฒิ -</option>
                  {degrees.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name_th}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={label}>สาขาวิชา</label>
                <select
                  className={field}
                  disabled={disabled}
                  value={it.major_id ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    const found = id ? majors.find((m) => m.id === id) : null;
                    updateItem(idx, { major_id: id, major_name: found?.name_th ?? "" });
                  }}
                >
                  <option value="">- เลือกสาขา -</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name_th}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={label}>มหาวิทยาลัย / สถาบัน</label>
                <select
                  className={field}
                  disabled={disabled}
                  value={it.institution_id ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    const found = id ? insts.find((u) => u.id === id) : null;
                    updateItem(idx, { institution_id: id, university_name: found?.name_th ?? "" });
                  }}
                >
                  <option value="">- เลือกสถาบัน -</option>
                  {insts.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name_th}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <label className={label}>ประเทศที่จบการศึกษา</label>
                <select className={field} disabled={disabled} value={it.country_id ?? ""} onChange={(e) => updateItem(idx, { country_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">- เลือกประเทศ -</option>
                  {options.countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_th}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={label}>ปีที่จบการศึกษา</label>
                <ThaiDateInput value={it.grad_date} onChange={(val) => updateItem(idx, { grad_date: val })} disabled={disabled} className={field} />
              </div>

              <div />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
