"use client";

import type { LicenseForm, LookupOptions } from "../ProfileClient";
import ThaiDateInput from "./ThaiDateInput";
import AttachmentField from "./AttachmentField";

type Props = {
  personId: number | null;
  items: LicenseForm[];
  onChange: (next: LicenseForm[]) => void;
  options: LookupOptions;
  disabled: boolean;
};

const emptyLicense = (): LicenseForm => ({
  license_id: null,
  license_type_id: null,
  license_name: "",
  issued_date: null,
  expiry_date: null,
  file_url: "",
  file_upload_url: null,
  file_upload_name: null,
});

export default function LicensesTab({ personId, items, onChange, options, disabled }: Props) {
  const field =
    "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-[11px] font-medium text-gray-600 dark:text-gray-300";
  const btn =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium " +
    "bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100";

  const updateItem = (idx: number, patch: Partial<LicenseForm>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, emptyLicense()]);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-200">ใบอนุญาตประกอบวิชาชีพ</div>
        <button type="button" disabled={disabled} onClick={addItem} className={`${btn} disabled:opacity-60`}>
          + เพิ่มใบอนุญาต
        </button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-3 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
          ยังไม่มีข้อมูล {!disabled && "กด “เพิ่มใบอนุญาต” เพื่อเพิ่มรายการแรก"}
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
                <label className={label}>ประเภทใบอนุญาต</label>
                <select
                  className={field}
                  disabled={disabled}
                  value={it.license_type_id ?? ""}
                  onChange={(e) => updateItem(idx, { license_type_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">- เลือก -</option>
                  {options.licenseTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name_th}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={label}>ชื่อใบอนุญาต</label>
                <input className={field} disabled={disabled} value={it.license_name} onChange={(e) => updateItem(idx, { license_name: e.target.value })} />
              </div>

              <div />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div>
                <label className={label}>วันที่ออก</label>
                <ThaiDateInput value={it.issued_date} onChange={(val) => updateItem(idx, { issued_date: val })} disabled={disabled} className={field} />
              </div>
              <div>
                <label className={label}>วันหมดอายุ</label>
                <ThaiDateInput value={it.expiry_date} onChange={(val) => updateItem(idx, { expiry_date: val })} disabled={disabled} className={field} />
              </div>

              <div className="md:col-span-2">
                <AttachmentField
                  disabled={disabled}
                  personId={personId}
                  tabName="licenses"
                  stage="req"
                  label="ไฟล์แนบ (ลิงก์ / อัปโหลด)"
                  fileUrl={it.file_url}
                  fileUploadUrl={it.file_upload_url}
                  fileUploadName={it.file_upload_name}
                  onChange={(patch) => updateItem(idx, patch as Partial<LicenseForm>)}
                  fieldClass={field}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
