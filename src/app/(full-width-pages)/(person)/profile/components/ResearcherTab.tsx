"use client";

import type { ResearcherForm, LookupOptions } from "../ProfileClient";

type Props = {
  value: ResearcherForm | null;
  onChange: (next: ResearcherForm | null) => void;
  options: LookupOptions;
  disabled: boolean;
};

export default function ResearcherTab({ value, onChange, options, disabled }: Props) {
  const field =
    "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-[11px] font-medium text-gray-600 dark:text-gray-300";

  const v: ResearcherForm = value ?? { person_researcher_id: null, researcher_status_id: null };

  return (
    <div className="space-y-3 text-xs">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-200">สถานะนักวิจัย</div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className={label}>สถานะนักวิจัย</label>
          <select
            className={field}
            disabled={disabled}
            value={v.researcher_status_id ?? ""}
            onChange={(e) =>
              onChange({
                ...v,
                researcher_status_id: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">- เลือก -</option>
            {options.researcherStatuses.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name_th}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
