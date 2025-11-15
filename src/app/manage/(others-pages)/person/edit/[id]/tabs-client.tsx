"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { key: "general", label: "ข้อมูลทั่วไป" },
  { key: "address", label: "ที่อยู่" },
  { key: "employment", label: "การจ้างงาน" },
  { key: "education", label: "การศึกษา" },          // multirow → placeholder
  { key: "licenses", label: "ใบอนุญาต" },           // placeholder
  { key: "movements", label: "โยกย้าย" },           // placeholder
  { key: "trainings", label: "อบรม" },              // placeholder
  { key: "decorations", label: "เครื่องราชฯ" },     // placeholder
  { key: "passports", label: "พาสปอร์ต" },         // placeholder
  { key: "penalties", label: "โทษทางวินัย" },       // placeholder
  { key: "researcher", label: "นักวิจัย" },         // placeholder
  { key: "scholar-orders", label: "คำสั่งทุน" },    // placeholder
  { key: "departments", label: "หน่วยงาน" },        // placeholder (หลายแถว)
];

export default function Tabs({ id }: { id: string }) {
  const pathname = usePathname(); // e.g. /person/edit/123/general
  const active = pathname?.split("/").pop();

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={`/manage/person/edit/${id}/${t.key}`}
            className={`px-3 py-1.5 rounded-xl border text-sm transition
              ${isActive
                ? "border-gray-900 dark:border-gray-200 bg-gray-100 dark:bg-gray-800"
                : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
