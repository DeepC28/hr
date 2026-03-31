"use client";

import type { DepartmentForm, LookupOptions } from "../ProfileClient";

type Props = {
  items: DepartmentForm[];
  onChange: (next: DepartmentForm[]) => void;
  options: LookupOptions;
  disabled: boolean;
};

const emptyDept = (): DepartmentForm => ({
  department_id: null,
  relation_level: 1,
  is_primary: false,
});

function normalizeRelationLevels(list: DepartmentForm[]): DepartmentForm[] {
  if (!list || list.length === 0) return [];

  const cloned = list.map((it) => ({ ...it }));

  let primaryIndex = cloned.findIndex((d) => d && d.is_primary);

  if (primaryIndex !== -1) {
    cloned.forEach((d, i) => {
      d.is_primary = i === primaryIndex;
    });
  }

  const orderedIndexes: number[] = [];

  if (primaryIndex !== -1) {
    orderedIndexes.push(primaryIndex);
    for (let i = 0; i < cloned.length; i++) if (i !== primaryIndex) orderedIndexes.push(i);
  } else {
    for (let i = 0; i < cloned.length; i++) orderedIndexes.push(i);
  }

  let level = 1;
  for (const idx of orderedIndexes) cloned[idx].relation_level = level++;

  return cloned;
}

export default function DepartmentsTab({ items, onChange, options, disabled }: Props) {
  const field =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-[11px] font-medium text-gray-600 dark:text-gray-300";
  const btn =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium " +
    "bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100";

  const updateAndNormalize = (next: DepartmentForm[]) => {
    const normalized = normalizeRelationLevels(next);
    onChange(normalized);
  };

  const updateItem = (idx: number, patch: Partial<DepartmentForm>) => {
    let next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));

    if (patch.is_primary !== undefined) {
      if (patch.is_primary) {
        next = next.map((it, i) => ({ ...it, is_primary: i === idx }));
      } else {
        next = next.map((it, i) => (i === idx ? { ...it, is_primary: false } : it));
      }
    }

    updateAndNormalize(next);
  };

  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    updateAndNormalize(next);
  };

  const addItem = () => updateAndNormalize([...items, emptyDept()]);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-200">หน่วยงาน / ภาควิชา ที่สังกัด</div>
        <button type="button" disabled={disabled} onClick={addItem} className={`${btn} disabled:opacity-60`}>
          + เพิ่มหน่วยงาน
        </button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-3 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
          ยังไม่มีหน่วยงาน {!disabled && "กด “เพิ่มหน่วยงาน” เพื่อเพิ่มรายการแรก"}
        </div>
      )}

      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                หน่วยงานที่ {idx + 1}{" "}
                <span className="ml-1 text-[10px] font-normal text-gray-500 dark:text-gray-400">(ลำดับ {it.relation_level})</span>
              </div>
              <button type="button" disabled={disabled} onClick={() => removeItem(idx)} className="text-[11px] text-red-500 hover:underline disabled:opacity-50">
                ลบหน่วยงานนี้
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className={label}>หน่วยงาน</label>
                <select className={field} disabled={disabled} value={it.department_id ?? ""} onChange={(e) => updateItem(idx, { department_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">- เลือกหน่วยงาน -</option>
                  {options.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name_th}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end justify-between gap-2 md:col-span-2">
                <div>
                  <label className={label}>เป็นหน่วยงานหลัก</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input type="checkbox" disabled={disabled} checked={!!it.is_primary} onChange={(e) => updateItem(idx, { is_primary: e.target.checked })} />
                    <span className="text-[11px] text-gray-600 dark:text-gray-300">เลือกได้เพียง 1 หน่วยงาน (จะเป็นลำดับ 1 เสมอ)</span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  * ระบบจะจัดลำดับ (relation_level) เป็น 1,2,3,4,... อัตโนมัติ
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
