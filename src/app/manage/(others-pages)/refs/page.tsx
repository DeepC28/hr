"use client";

import React, { useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TabKey =
  | "prefix-name" | "gender" | "nationality" | "country"
  | "grad-level" | "time-contract" | "staff-type" | "substaff-type"
  | "budget" | "admin-position" | "academic-standing"
  | "scholar-order-type" | "support-level" | "movement-type" | "address-codebook";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "prefix-name", label: "คำนำหน้า" },
  { key: "gender", label: "เพศ" },
  { key: "nationality", label: "สัญชาติ" },
  { key: "country", label: "ประเทศ" },
  { key: "grad-level", label: "ระดับการศึกษา" },
  { key: "time-contract", label: "เวลาจ้าง" },
  { key: "staff-type", label: "ประเภทบุคลากร" },
  { key: "substaff-type", label: "กลุ่มย่อยบุคลากร" },
  { key: "budget", label: "งบประมาณ" },
  { key: "admin-position", label: "ตำแหน่งบริหาร" },
  { key: "academic-standing", label: "สถานภาพวิชาการ" },
  { key: "scholar-order-type", label: "ประเภทคำสั่งทุน" },
  { key: "support-level", label: "ระดับสนับสนุน" },
  { key: "movement-type", label: "ประเภทการเคลื่อนไหว" },
  { key: "address-codebook", label: "สมุดที่อยู่/รหัสไปรษณีย์" },
];

const Loading = () => <div className="text-sm text-gray-500">กำลังโหลด…</div>;

const TabComponents: Record<TabKey, React.ComponentType<any>> = {
  "prefix-name":       dynamic(() => import("./_tabs/prefix-name").then(m => m.default), { ssr:false, loading: Loading }),
  "gender":            dynamic(() => import("./_tabs/gender").then(m => m.default), { ssr:false, loading: Loading }),
  "nationality":       dynamic(() => import("./_tabs/nationality").then(m => m.default), { ssr:false, loading: Loading }),
  "country":           dynamic(() => import("./_tabs/country").then(m => m.default), { ssr:false, loading: Loading }),
  "grad-level":        dynamic(() => import("./_tabs/grad-level").then(m => m.default), { ssr:false, loading: Loading }),
  "time-contract":     dynamic(() => import("./_tabs/time-contract").then(m => m.default), { ssr:false, loading: Loading }),
  "staff-type":        dynamic(() => import("./_tabs/staff-type").then(m => m.default), { ssr:false, loading: Loading }),
  "substaff-type":     dynamic(() => import("./_tabs/substaff-type").then(m => m.default), { ssr:false, loading: Loading }),
  "budget":            dynamic(() => import("./_tabs/budget").then(m => m.default), { ssr:false, loading: Loading }),
  "admin-position":    dynamic(() => import("./_tabs/admin-position").then(m => m.default), { ssr:false, loading: Loading }),
  "academic-standing": dynamic(() => import("./_tabs/academic-standing").then(m => m.default), { ssr:false, loading: Loading }),
  "scholar-order-type":dynamic(() => import("./_tabs/scholar-order-type").then(m => m.default), { ssr:false, loading: Loading }),
  "support-level":     dynamic(() => import("./_tabs/support-level").then(m => m.default), { ssr:false, loading: Loading }),
  "movement-type":     dynamic(() => import("./_tabs/movement-type").then(m => m.default), { ssr:false, loading: Loading }),
  "address-codebook":  dynamic(() => import("./_tabs/address-codebook").then(m => m.default), { ssr:false, loading: Loading }),
};

function TabsBar({
  items, activeKey, onChange,
}: {
  items: Array<{ key: string; label: string }>;
  activeKey: string;
  onChange: (key: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dx: number) => scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });

  const activeCls =
    "border text-sm px-3 py-1.5 rounded-full transition-colors " +
    "bg-indigo-50 text-indigo-700 border-indigo-500 " +
    "dark:bg-gray-800 dark:text-indigo-300 dark:border-indigo-400 " +
    "shadow-sm ring-1 ring-indigo-500/10 dark:ring-indigo-400/10";

  const inactiveCls =
    "border text-sm px-3 py-1.5 rounded-full transition-colors " +
    "border-transparent text-gray-900 hover:bg-gray-50 hover:text-indigo-600 " +
    "dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-indigo-300";

  return (
    <div className="mb-4">
      {/* Mobile: select */}
      <div className="sm:hidden mb-3">
        <label className="sr-only">เลือกหมวด</label>
        <select
          value={activeKey}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border bg-white text-gray-900 border-gray-300
                     dark:bg-gray-900 dark:text-white dark:border-gray-700"
        >
          {items.map((it) => (
            <option key={it.key} value={it.key}>{it.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop: horizontal buttons */}
      <div className="relative hidden sm:block">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent dark:from-gray-900" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent dark:from-gray-900" />

        <button
          aria-label="เลื่อนซ้าย"
          onClick={() => scrollBy(-220)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full border p-1.5
                     bg-white/85 border-gray-300 hover:bg-white
                     dark:bg-gray-900/85 dark:border-gray-700 dark:hover:bg-gray-800 backdrop-blur dark:text-white">‹</button>
        <button
          aria-label="เลื่อนขวา"
          onClick={() => scrollBy(220)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full border p-1.5
                     bg-white/85 border-gray-300 hover:bg-white
                     dark:bg-gray-900/85 dark:border-gray-700 dark:hover:bg-gray-800 backdrop-blur dark:text-white">›</button>

        <div ref={scrollerRef} className="no-scrollbar overflow-x-auto whitespace-nowrap pl-8 pr-8">
          <div className="inline-flex gap-2">
            {items.map((it) => {
              const isActive = it.key === activeKey;
              return (
                <button
                  key={it.key}
                  onClick={() => onChange(it.key)}
                  aria-selected={isActive}
                  className={isActive ? activeCls : inactiveCls}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const activeFromQuery = (params.get("tab") as TabKey) || TABS[0].key;
  const active: TabKey = TABS.some(t => t.key === activeFromQuery) ? activeFromQuery : TABS[0].key;

  const ActiveComp = useMemo(
    () => TabComponents[active] || TabComponents[TABS[0].key],
    [active]
  );

  const setTab = (key: string) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", key);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  return (
    <div className="p-4">
      <header className="mb-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ข้อมูลอ้างอิง (ทั้งหมด)</h1>
      </header>

      <TabsBar items={TABS} activeKey={active} onChange={setTab} />

      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="p-4">
          <ActiveComp />
        </div>
      </section>
    </div>
  );
}
