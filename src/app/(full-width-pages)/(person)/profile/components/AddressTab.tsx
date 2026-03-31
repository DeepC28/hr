"use client";

import { useEffect, useMemo, useState } from "react";
import type { PersonForm } from "../ProfileClient";

type Props = {
  person: PersonForm;
  onChange: (next: PersonForm) => void;
  disabled: boolean;
};

type SubdistrictOption = {
  sub_district_id: string;
  name_th: string;
  district_name_th: string | null;
  province_name_th: string | null;
  zipcode: string | null;
};

export default function AddressTab({ person, onChange, disabled }: Props) {
  const [subdistricts, setSubdistricts] = useState<SubdistrictOption[]>([]);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [subdistrictError, setSubdistrictError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const set = <K extends keyof PersonForm>(key: K, value: PersonForm[K]) => onChange({ ...person, [key]: value });

  const field =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-indigo-500 " +
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const label = "text-xs font-medium text-gray-600 dark:text-gray-300";

  const formatOptionLabel = (s: SubdistrictOption) => {
    const parts: string[] = [];
    if (s.district_name_th) parts.push(s.district_name_th);
    if (s.province_name_th) parts.push(s.province_name_th);
    return `${s.name_th}${parts.length ? ` (${parts.join(", ")})` : ""}`;
  };

  const currentSubdistrict = useMemo(() => {
    if (!person.sub_district_id) return null;
    return subdistricts.find((s) => s.sub_district_id === String(person.sub_district_id)) || null;
  }, [person.sub_district_id, subdistricts]);

  const filteredOptions = useMemo(() => {
    if (!subdistricts.length) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return subdistricts.slice(0, 50);

    return subdistricts
      .filter((s) => {
        const t1 = s.name_th.toLowerCase();
        const t2 = (s.district_name_th || "").toLowerCase();
        const t3 = (s.province_name_th || "").toLowerCase();
        const z = (s.zipcode || "").toLowerCase();
        return t1.includes(term) || t2.includes(term) || t3.includes(term) || z.includes(term);
      })
      .slice(0, 50);
  }, [subdistricts, searchTerm]);

  useEffect(() => {
    const loadSubdistricts = async () => {
      try {
        setLoadingSubdistricts(true);
        setSubdistrictError(null);

        const res = await fetch("/api/address/subdistricts", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.message || "โหลดรายการตำบลไม่สำเร็จ (address_codebook)");

        const items: SubdistrictOption[] = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];

        setSubdistricts(
          items.map((s) => ({
            sub_district_id: String(s.sub_district_id),
            name_th: s.name_th,
            district_name_th: s.district_name_th ?? null,
            province_name_th: s.province_name_th ?? null,
            zipcode: s.zipcode ?? null,
          })),
        );
      } catch (err: any) {
        console.error(err);
        setSubdistrictError(err?.message || "โหลดรายการตำบลจากฐานข้อมูลไม่สำเร็จ");
      } finally {
        setLoadingSubdistricts(false);
      }
    };

    loadSubdistricts();
  }, []);

  useEffect(() => {
    if (!currentSubdistrict) return;
    const labelText = formatOptionLabel(currentSubdistrict);
    setSearchTerm(labelText);

    if (currentSubdistrict.zipcode && currentSubdistrict.zipcode !== person.zipcode) {
      set("zipcode", currentSubdistrict.zipcode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSubdistrict?.sub_district_id]);

  const handleSelectSubdistrict = (s: SubdistrictOption) => {
    setSearchTerm(formatOptionLabel(s));
    const next: PersonForm = { ...person, sub_district_id: s.sub_district_id, zipcode: s.zipcode ?? null };
    onChange(next);
    setDropdownOpen(false);
  };

  const handleSearchFocus = () => {
    if (!disabled) setDropdownOpen(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setDropdownOpen(false), 150);
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={label}>บ้านเลขที่</label>
          <input className={field} disabled={disabled} value={person.home_no ?? ""} onChange={(e) => set("home_no", e.target.value || null)} />
        </div>
        <div>
          <label className={label}>หมู่</label>
          <input className={field} disabled={disabled} value={person.moo ?? ""} onChange={(e) => set("moo", e.target.value || null)} />
        </div>
        <div>
          <label className={label}>ถนน</label>
          <input className={field} disabled={disabled} value={person.street ?? ""} onChange={(e) => set("street", e.target.value || null)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative">
          <label className={label}>ตำบล</label>
          <input
            className={field}
            disabled={disabled}
            value={searchTerm}
            placeholder={loadingSubdistricts ? "กำลังโหลดรายการตำบล..." : "พิมพ์ค้นหา ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!disabled) setDropdownOpen(true);
            }}
          />

          {subdistrictError && <div className="mt-1 text-[11px] text-red-600 dark:text-red-400">{subdistrictError}</div>}

          {dropdownOpen && !disabled && !loadingSubdistricts && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400">ไม่พบตำบลที่ตรงกับคำค้นหา</div>
              ) : (
                filteredOptions.map((s) => (
                  <button
                    key={s.sub_district_id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSubdistrict(s);
                    }}
                    className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                  >
                    <span className="text-[11px] font-medium text-gray-900 dark:text-gray-100">{formatOptionLabel(s)}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      รหัสตำบล: {s.sub_district_id}
                      {s.zipcode ? ` • รหัสไปรษณีย์: ${s.zipcode}` : ""}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <label className={label}>อำเภอ</label>
          <input className={field + " bg-gray-100 dark:bg-gray-800"} disabled value={currentSubdistrict?.district_name_th ?? ""} />
        </div>

        <div>
          <label className={label}>จังหวัด</label>
          <input className={field + " bg-gray-100 dark:bg-gray-800"} disabled value={currentSubdistrict?.province_name_th ?? ""} />
        </div>

        <div>
          <label className={label}>รหัสไปรษณีย์</label>
          <input className={field + " bg-gray-100 dark:bg-gray-800"} disabled value={person.zipcode ?? currentSubdistrict?.zipcode ?? ""} />
        </div>
      </div>
    </div>
  );
}
