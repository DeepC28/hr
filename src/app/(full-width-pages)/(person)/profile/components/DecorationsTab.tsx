"use client";

import type { DecorationForm, LookupOptions } from "../ProfileClient";
import ThaiDateInput from "./ThaiDateInput";

type Props = {
  items: DecorationForm[];
  onChange: (next: DecorationForm[]) => void;
  options: LookupOptions;
  disabled: boolean;
};

const emptyDecoration = (): DecorationForm => ({
  person_decoration_id: null,
  decoration_id: null,
  received_date: null,
});

export default function DecorationsTab({ items, onChange, options, disabled }: Props) {
  const field =
    "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-[11px] font-medium text-gray-600 dark:text-gray-300";
  const btn =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium " +
    "bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100";

  const updateItem = (idx: number, patch: Partial<DecorationForm>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, emptyDecoration()]);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-200">เครื่องราชอิสริยาภรณ์</div>
        <button type="button" disabled={disabled} onClick={addItem} className={`${btn} disabled:opacity-60`}>
          + เพิ่มเครื่องราชฯ
        </button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-3 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
          ยังไม่มีข้อมูล {!disabled && "กด “เพิ่มเครื่องราชฯ” เพื่อเพิ่มรายการแรก"}
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
              <div className="md:col-span-2">
                <label className={label}>เครื่องราชฯ</label>
                <select className={field} disabled={disabled} value={it.decoration_id ?? ""} onChange={(e) => updateItem(idx, { decoration_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">- เลือก -</option>
                  {options.decorations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name_th}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={label}>วันที่ได้รับ</label>
                <ThaiDateInput value={it.received_date} onChange={(val) => updateItem(idx, { received_date: val })} disabled={disabled} className={field} />
              </div>

              <div />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
