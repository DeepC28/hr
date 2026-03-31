"use client";

import type { TrainingForm, Option4 } from "../ProfileClient";
import ThaiDateInput from "./ThaiDateInput";
import AttachmentField from "./AttachmentField";

type Props = {
  personId: number | null;
  items: TrainingForm[];
  onChange: (next: TrainingForm[]) => void;
  disabled: boolean;
  countries: Option4[];
};

const emptyTraining = (): TrainingForm => ({
  training_id: null,
  title: "",
  provider: "",
  hours: "",
  days: "",
  location: "",
  country_id: null,
  start_date: null,
  end_date: null,
  file_url: "",
  file_upload_url: null,
  file_upload_name: null,
});

export default function TrainingsTab({ personId, items, onChange, disabled, countries }: Props) {
  const field =
    "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-[11px] font-medium text-gray-600 dark:text-gray-300";
  const btn =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium " +
    "bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100";

  const updateItem = (idx: number, patch: Partial<TrainingForm>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, emptyTraining()]);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-200">ประวัติการฝึกอบรม</div>
        <button type="button" disabled={disabled} onClick={addItem} className={`${btn} disabled:opacity-60`}>
          + เพิ่มฝึกอบรม
        </button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-3 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
          ยังไม่มีข้อมูล {!disabled && "กด “เพิ่มฝึกอบรม” เพื่อเพิ่มรายการแรก"}
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
                <label className={label}>หัวข้อ</label>
                <input className={field} disabled={disabled} value={it.title} onChange={(e) => updateItem(idx, { title: e.target.value })} />
              </div>

              <div>
                <label className={label}>หน่วยงาน/ผู้จัด</label>
                <input className={field} disabled={disabled} value={it.provider} onChange={(e) => updateItem(idx, { provider: e.target.value })} />
              </div>

              <div>
                <label className={label}>สถานที่</label>
                <input className={field} disabled={disabled} value={it.location} onChange={(e) => updateItem(idx, { location: e.target.value })} />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div>
                <label className={label}>ชั่วโมง</label>
                <input className={field} disabled={disabled} value={it.hours} onChange={(e) => updateItem(idx, { hours: e.target.value })} />
              </div>
              <div>
                <label className={label}>วัน</label>
                <input className={field} disabled={disabled} value={it.days} onChange={(e) => updateItem(idx, { days: e.target.value })} />
              </div>
              <div>
                <label className={label}>เริ่ม</label>
                <ThaiDateInput value={it.start_date} onChange={(val) => updateItem(idx, { start_date: val })} disabled={disabled} className={field} />
              </div>
              <div>
                <label className={label}>สิ้นสุด</label>
                <ThaiDateInput value={it.end_date} onChange={(val) => updateItem(idx, { end_date: val })} disabled={disabled} className={field} />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div>
                <label className={label}>ประเทศ</label>
                <select className={field} disabled={disabled} value={it.country_id ?? ""} onChange={(e) => updateItem(idx, { country_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">- เลือกประเทศ -</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_th}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <AttachmentField
                  disabled={disabled}
                  personId={personId}
                  tabName="trainings"
                  stage="req"
                  label="ไฟล์แนบ (ลิงก์ / อัปโหลด)"
                  fileUrl={it.file_url}
                  fileUploadUrl={it.file_upload_url}
                  fileUploadName={it.file_upload_name}
                  onChange={(patch) => updateItem(idx, patch as Partial<TrainingForm>)}
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
