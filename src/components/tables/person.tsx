"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

/** ===== paths ===== */
const CREATE_PATH = "/manage/person/add";
const EDIT_PATH = (id: number) => `/manage/person/edit/${id}/general`;

type PersonRow = {
  person_id: number;
  citizen_id: string | null;
  first_name_th: string;
  last_name_th: string;
  email: string | null;
  telephone: string | null;
  picture_url: string | null;
  department_id: number | null;
  department_name: string | null;
  position_title: string | null;
};

function isDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}
function swalConfirm(opts: { title: string; text?: string }) {
  const dark = isDark();
  return Swal.fire({
    title: opts.title,
    text: opts.text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ลบ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: dark ? "#ef4444" : "#e02424",
    background: dark ? "#0b0f19" : "#ffffff",
    color: dark ? "#e5e7eb" : "#111827",
    reverseButtons: true,
  });
}
function swalToastSuccess(text: string) {
  const dark = isDark();
  return Swal.fire({
    title: "สำเร็จ",
    text,
    icon: "success",
    timer: 1200,
    showConfirmButton: false,
    background: dark ? "#0b0f19" : "#ffffff",
    color: dark ? "#e5e7eb" : "#111827",
  });
}

export default function PersonTable() {
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [goto, setGoto] = useState<string>("");

  const fetchPersons = async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const url = q.trim()
        ? `/api/person/list?q=${encodeURIComponent(q.trim())}`
        : `/api/person/list`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PersonRow[] = await res.json();
      setRows(data);
    } catch (e: any) {
      setErrMsg(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);
  useEffect(() => {
    setPage(1);
  }, [q, pageSize]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const kw = q.toLowerCase();
    return rows.filter((r) => {
      const full = `${r.first_name_th} ${r.last_name_th}`.trim().toLowerCase();
      return (
        (r.citizen_id || "").toLowerCase().includes(kw) ||
        full.includes(kw) ||
        (r.email || "").toLowerCase().includes(kw) ||
        (r.telephone || "").toLowerCase().includes(kw) ||
        (r.department_name || "").toLowerCase().includes(kw) ||
        (r.position_title || "").toLowerCase().includes(kw)
      );
    });
  }, [rows, q]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const fromIdx = (current - 1) * pageSize;
  const toIdx = Math.min(fromIdx + pageSize, total);
  const pageRows = filtered.slice(fromIdx, toIdx);

  const pageWindow = useMemo(() => {
    const span = 5;
    let start = Math.max(1, current - Math.floor(span / 2));
    let end = Math.min(totalPages, start + span - 1);
    if (end - start + 1 < span) start = Math.max(1, end - span + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [current, totalPages]);

  const handleDelete = async (id: number) => {
    const row = rows.find((r) => r.person_id === id);
    const res = await swalConfirm({
      title: "ลบรายการนี้?",
      text: row ? `${row.first_name_th} ${row.last_name_th}` : "",
    });
    if (!res.isConfirmed) return;
    try {
      const r = await fetch(`/api/person/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "ลบไม่สำเร็จ");
      await swalToastSuccess("ลบรายการแล้ว");
      await fetchPersons();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "ลบไม่สำเร็จ",
        text: e?.message || "เกิดข้อผิดพลาด",
      });
    }
  };

  const jumpToPage = () => {
    const n = parseInt(goto, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      setPage(n);
      setGoto("");
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="text-sm text-gray-500 dark:text-white/40">
        ตาราง: รายชื่อบุคคล
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPersons()}
            placeholder="ค้นหา: บัตรประชาชน / ชื่อ-สกุล / อีเมล / เบอร์ / หน่วยงาน / ตำแหน่ง"
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-400
                       focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-[420px]
                       dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700 dark:focus:ring-brand-400/20"
          />
          {q && (
            <button
              onClick={() => {
                setQ("");
                fetchPersons();
              }}
              className="h-10 rounded-xl px-3 text-sm text-white bg-blue-600 hover:bg-blue-700
                         focus:outline-none focus:ring-2 focus:ring-blue-600/30
                         dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-blue-400/30"
            >
              ล้าง
            </button>
          )}
          <div className="ml-2 hidden items-center gap-2 sm:flex">
            <span className="text-xs text-gray-500 dark:text-white/40">
              แถว/หน้า
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="h-10 rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-800
                         dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={CREATE_PATH}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm
                       font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30
                       dark:bg-brand-500 dark:hover:bg-brand-400 dark:focus:ring-brand-400/30"
          >
            เพิ่มบุคคล
          </Link>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-gray-50/80 dark:bg-white/[0.04]">
            <tr className="text-left text-gray-600 dark:text-white/60">
              <th className="w-[320px] px-4 py-3">ชื่อ-สกุล</th>
              <th className="w-[220px] px-4 py-3">หน่วยงาน</th>
              <th className="w-[200px] px-4 py-3">ตำแหน่ง</th>
              <th className="px-4 py-3">ติดต่อ</th>
              <th className="w-[220px] px-4 py-3 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/[0.06]">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-gray-400 dark:text-white/40"
                >
                  กำลังโหลด...
                </td>
              </tr>
            ) : errMsg ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-red-500">
                  โหลดข้อมูลผิดพลาด: {errMsg}
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-gray-400 dark:text-white/40"
                >
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr
                  key={r.person_id}
                  className="text-gray-800 hover:bg-gray-50/70 dark:text-white/90 dark:hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                        {r.picture_url ? (
                          <img
                            src={r.picture_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-white/50">
                            N/A
                          </span>
                        )}
                      </div>
                      <div className="leading-tight">
                        <div className="font-medium">
                          {r.first_name_th} {r.last_name_th}
                        </div>
                        {r.citizen_id && (
                          <div className="text-xs text-gray-400 dark:text-white/40">
                            {r.citizen_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.department_name || "-"}</td>
                  <td className="px-4 py-3">{r.position_title || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      {r.telephone ? (
                        <div className="text-gray-700 dark:text-white/80">
                          {r.telephone}
                        </div>
                      ) : (
                        <div className="text-gray-400 dark:text-white/40">-</div>
                      )}
                      {r.email ? (
                        <div className="text-gray-500 dark:text-white/60">
                          {r.email}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={EDIT_PATH(r.person_id)}
                        className="inline-flex h-9 items-center justify-center rounded-lg px-3
                 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700
                 focus:outline-none focus:ring-2 focus:ring-brand-500/30
                 dark:bg-brand-500 dark:hover:bg-brand-400 dark:focus:ring-brand-400/30"
                      >
                        แก้ไข
                      </Link>

                      <button
                        onClick={() => handleDelete(r.person_id)}
                        className="inline-flex h-9 items-center justify-center rounded-lg px-3
                 text-xs font-medium text-white bg-red-600 hover:bg-red-700
                 focus:outline-none focus:ring-2 focus:ring-red-500/30
                 dark:bg-red-500 dark:hover:bg-red-400 dark:focus:ring-red-400/30"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-xs text-gray-600 dark:text-white/60">
          แสดง{" "}
          <span className="font-medium">{total === 0 ? 0 : fromIdx + 1}</span> –
          <span className="font-medium"> {toIdx}</span> จาก
          <span className="font-medium"> {total}</span> รายการ
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="h-9 rounded-lg px-3 text-xs text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-50
                             focus:outline-none focus:ring-2 focus:ring-gray-600/30
                             dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-500/30"
            onClick={() => setPage(1)}
            disabled={current === 1}
          >
            « หน้าแรก
          </button>
          <button
            className="h-9 rounded-lg px-3 text-xs text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-50
                             focus:outline-none focus:ring-2 focus:ring-gray-600/30
                             dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-500/30"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
          >
            ‹ ก่อนหน้า
          </button>
          {pageWindow.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-9 min-w-[38px] rounded-lg px-3 text-xs focus:outline-none ${
                n === current
                  ? "bg-brand-600 text-white hover:bg-brand-700 focus:ring-2 focus:ring-brand-500/30 dark:bg-brand-500 dark:hover:bg-brand-400 dark:focus:ring-brand-400/30"
                  : "text-white bg-gray-700 hover:bg-gray-800 focus:ring-2 focus:ring-gray-600/30 dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-500/30"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            className="h-9 rounded-lg px-3 text-xs text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-50
                             focus:outline-none focus:ring-2 focus:ring-gray-600/30
                             dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-500/30"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
          >
            ถัดไป ›
          </button>
          <button
            className="h-9 rounded-lg px-3 text-xs text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-50
                             focus:outline-none focus:ring-2 focus:ring-gray-600/30
                             dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-500/30"
            onClick={() => setPage(totalPages)}
            disabled={current === totalPages}
          >
            หน้าสุดท้าย »
          </button>

          <div className="ml-2 flex items-center gap-1">
            <span className="text-xs text-gray-600 dark:text-white/60">
              ไปหน้า
            </span>
            <input
              value={goto}
              onChange={(e) => setGoto(e.target.value.replace(/\D+/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && jumpToPage()}
              placeholder={`${current}/${totalPages}`}
              className="h-9 w-16 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm text-gray-800
                         dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            />
            <button
              onClick={jumpToPage}
              className="h-9 rounded-lg px-3 text-xs text-white bg-gray-700 hover:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-gray-600/30
                         dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-500/30"
            >
              ไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
