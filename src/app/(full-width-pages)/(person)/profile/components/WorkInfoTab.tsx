"use client";

import type { PersonForm, LookupOptions } from "../ProfileClient";
import ThaiDateInput from "./ThaiDateInput";

type Props = {
  person: PersonForm;
  onChange: (next: PersonForm) => void;
  options: LookupOptions;
  disabled: boolean;
};

export default function WorkInfoTab({ person, onChange, options, disabled }: Props) {
  const field =
    "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-[11px] font-medium text-gray-600 dark:text-gray-300";

  const set = <K extends keyof PersonForm>(key: K, value: PersonForm[K]) => onChange({ ...person, [key]: value });

  return (
    <div className="space-y-4 text-xs">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={label}>ประเภทบุคลากร</label>
          <select className={field} disabled={disabled} value={person.stafftype_id ?? ""} onChange={(e) => set("stafftype_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกประเภทบุคลากร -</option>
            {options.staffTypes.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name_th}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>ประเภทตำแหน่ง</label>
          <select className={field} disabled={disabled} value={person.substafftype_id ?? ""} onChange={(e) => set("substafftype_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกประเภทตำแหน่ง -</option>
            {options.substaffTypes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_th}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className={label}>ตำแหน่งบริหาร</label>
          <select className={field} disabled={disabled} value={person.admin_position_id ?? ""} onChange={(e) => set("admin_position_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกตำแหน่งบริหาร -</option>
            {options.adminPositions.map((ad) => (
              <option key={ad.id} value={ad.id}>
                {ad.name_th}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>ระดับตำแหน่งทางวิชาการ</label>
          <select className={field} disabled={disabled} value={person.academicstanding_id ?? ""} onChange={(e) => set("academicstanding_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกระดับตำแหน่งทางวิชาการ -</option>
            {options.academicStandings.map((ac) => (
              <option key={ac.id} value={ac.id}>
                {ac.name_th}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>ระดับตำแหน่ง (สายสนับสนุน)</label>
          <select className={field} disabled={disabled} value={person.positionlevel_id ?? ""} onChange={(e) => set("positionlevel_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกระดับตำแหน่ง -</option>
            {options.supportLevels.map((sl) => (
              <option key={sl.id} value={sl.id}>
                {sl.name_th}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={label}>สังกัดมหาวิทยาลัย</label>
          <select className={field} disabled={disabled} value={person.univ_id ?? ""} onChange={(e) => set("univ_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกสังกัด -</option>
            {options.universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>ชื่อตำแหน่งงาน</label>
          <input className={field} disabled={disabled} value={person.position_work ?? ""} onChange={(e) => set("position_work", e.target.value || null)} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className={label}>ประเภทเงินเดือน</label>
          <select className={field} disabled={disabled} value={person.budget_id ?? ""} onChange={(e) => set("budget_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกประเภทเงินเดือน -</option>
            {options.budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name_th}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>รูปแบบสัญญาจ้าง</label>
          <select className={field} disabled={disabled} value={person.time_contract_id ?? ""} onChange={(e) => set("time_contract_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">- เลือกรูปแบบสัญญาจ้าง -</option>
            {options.timeContracts.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.name_th}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>วันที่สิ้นสุดสัญญา (ถ้ามี)</label>
          <ThaiDateInput value={person.contract_end_date} onChange={(val) => set("contract_end_date", val)} disabled={disabled} className={field} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={label}>วันที่เริ่มปฏิบัติงาน</label>
          <ThaiDateInput value={person.date_inwork} onChange={(val) => set("date_inwork", val)} disabled={disabled} className={field} />
        </div>
        <div>
          <label className={label}>วันที่เริ่มปฏิบัติงานที่มหาวิทยาลัย</label>
          <ThaiDateInput value={person.date_start_this_u} onChange={(val) => set("date_start_this_u", val)} disabled={disabled} className={field} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={label}>เงินเดือน</label>
          <input type="number" className={field} disabled={disabled} value={person.income_amount ?? ""} onChange={(e) => set("income_amount", e.target.value || null)} />
        </div>
        <div>
          <label className={label}>ค่าครองชีพ</label>
          <input type="number" className={field} disabled={disabled} value={person.cost_of_living ?? ""} onChange={(e) => set("cost_of_living", e.target.value || null)} />
        </div>
      </div>
    </div>
  );
}
