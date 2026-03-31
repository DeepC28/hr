"use client";

import type { ScholarOrderForm, LookupOptions } from "../ProfileClient";
import ThaiDateInput from "./ThaiDateInput";

type Props = {
  items: ScholarOrderForm[];
  onChange: (next: ScholarOrderForm[]) => void;
  options: LookupOptions;
  disabled: boolean;
};

const emptyOrder = (): ScholarOrderForm => ({
  person_scholar_order_id: null,
  scholar_order_id: null,
  order_no: "",
  duration_years: "",
  duration_months: "",
  duration_days: "",
  order_date_start: null,
  order_date_end: null,
});

export default function ScholarOrdersTab({ items, onChange, options, disabled }: Props) {
  const field =
    "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-[11px] font-medium text-gray-600 dark:text-gray-300";
  const btn =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium " +
    "bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100";

  const updateItem = (idx: number, patch: Partial<ScholarOrderForm>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, emptyOrder()]);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-200">คำสั่งทุน / Scholar Order</div>
        <button type="button" disabled={disabled} onClick={addItem} className={`${btn} disabled:opacity-60`}>
          + เพิ่มคำสั่งทุน
        </button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-3 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
          ยังไม่มีข้อมูล {!disabled && "กด “เพิ่มคำสั่งทุน” เพื่อเพิ่มรายการแรก"}
        </div>
      )}

      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">รายการที่ {idx + 1}</div>
              <button type="button" disabled={disabled} onClick={() => removeItem(idx)} className="text-[11px] text-red-500 hover:underline disabled:opacity-50">
                ลบรายการนี้
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className={label}>ประเภทคำสั่ง</label>
                <select className={field} disabled={disabled} value={it.scholar_order_id ?? ""} onChange={(e) => updateItem(idx, { scholar_order_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">- เลือก -</option>
                  {options.scholarOrderTypes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name_th}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={label}>เลขที่คำสั่ง</label>
                <input className={field} disabled={disabled} value={it.order_no} onChange={(e) => updateItem(idx, { order_no: e.target.value })} />
              </div>

              <div>
                <label className={label}>เริ่ม</label>
                <ThaiDateInput value={it.order_date_start} onChange={(val) => updateItem(idx, { order_date_start: val })} disabled={disabled} className={field} />
              </div>

              <div>
                <label className={label}>สิ้นสุด</label>
                <ThaiDateInput value={it.order_date_end} onChange={(val) => updateItem(idx, { order_date_end: val })} disabled={disabled} className={field} />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div>
                <label className={label}>ระยะเวลา (ปี)</label>
                <input className={field} disabled={disabled} value={it.duration_years} onChange={(e) => updateItem(idx, { duration_years: e.target.value })} />
              </div>
              <div>
                <label className={label}>ระยะเวลา (เดือน)</label>
                <input className={field} disabled={disabled} value={it.duration_months} onChange={(e) => updateItem(idx, { duration_months: e.target.value })} />
              </div>
              <div>
                <label className={label}>ระยะเวลา (วัน)</label>
                <input className={field} disabled={disabled} value={it.duration_days} onChange={(e) => updateItem(idx, { duration_days: e.target.value })} />
              </div>
              <div />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
