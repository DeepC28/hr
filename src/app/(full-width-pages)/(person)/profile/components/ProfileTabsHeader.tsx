"use client";

export type ProfileTabKey =
  | "basic"
  | "address"
  | "work"
  | "education"
  | "licenses"
  | "movements"
  | "trainings"
  | "decorations"
  | "penalties"
  | "researcher"
  | "scholar-orders"
  | "departments";

type Props = {
  active: ProfileTabKey;
  onChange: (k: ProfileTabKey) => void;
};

const tabs: { key: ProfileTabKey; label: string }[] = [
  { key: "basic", label: "ข้อมูลทั่วไป" },
  { key: "address", label: "ที่อยู่" },
  { key: "work", label: "งาน/ตำแหน่ง" },
  { key: "education", label: "การศึกษา" },
  { key: "licenses", label: "ใบอนุญาต" },
  { key: "movements", label: "ย้าย/เคลื่อนไหว" },
  { key: "trainings", label: "ฝึกอบรม" },
  { key: "decorations", label: "เครื่องราชฯ" },
  { key: "penalties", label: "โทษ" },
  { key: "researcher", label: "นักวิจัย" },
  { key: "scholar-orders", label: "คำสั่งทุน" },
  { key: "departments", label: "หน่วยงาน" },
];

export default function ProfileTabsHeader({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={
            "rounded-full border px-3 py-1 text-xs transition " +
            (active === t.key
              ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-200"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800")
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
