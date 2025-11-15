"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type Department = {
  department_id: number;
  code: string;
  name_th: string;
  name_en?: string | null;
  parent_id?: number | null;
  parent_name?: string | null;
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
    customClass: {
      popup: dark ? "dark:shadow-none" : "",
      confirmButton: "rounded-lg px-4 py-2",
      cancelButton: "rounded-lg px-4 py-2",
    },
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

type FormState = {
  code: string;
  name_th: string;
  name_en?: string;
  parent_id?: number | null;
};

export default function DepartmentTable() {
  const router = useRouter();

  // data/search
  const [rows, setRows] = useState<Department[]>([]);
  const [q, setQ] = useState("");

  // loading/error
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [goto, setGoto] = useState<string>("");

  // modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ code: "", name_th: "", name_en: "", parent_id: null });
  const [formErr, setFormErr] = useState<Record<string, string>>({});

  // fetch from API
  const fetchList = async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const url = q.trim() ? `/api/department/list?q=${encodeURIComponent(q.trim())}` : `/api/department/list`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Department[] = await res.json();
      setRows(data);
    } catch (e: any) {
      setErrMsg(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      await fetchList();
    })();
    return () => void (alive = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, pageSize]);

  // filter (ย้ายไปทำใน API ก็ได้ แต่คงไว้ให้รองรับสองทาง)
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const kw = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(kw) ||
        r.name_th.toLowerCase().includes(kw) ||
        (r.parent_name || "").toLowerCase().includes(kw)
    );
  }, [rows, q]);

  // paginate
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const fromIdx = (current - 1) * pageSize;
  const toIdx = Math.min(fromIdx + pageSize, total);
  const pageRows = filtered.slice(fromIdx, toIdx);

  // page buttons window
  const pageWindow = useMemo(() => {
    const span = 5;
    let start = Math.max(1, current - Math.floor(span / 2));
    let end = Math.min(totalPages, start + span - 1);
    if (end - start + 1 < span) start = Math.max(1, end - span + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [current, totalPages]);

  // open modal (create)
  const openCreate = () => {
    setEditingId(null);
    setForm({ code: "", name_th: "", name_en: "", parent_id: null });
    setFormErr({});
    setIsOpen(true);
  };

  // open modal (edit)
  const openEdit = (id: number) => {
    const row = rows.find((r) => r.department_id === id);
    if (!row) return;
    setEditingId(id);
    setForm({
      code: row.code ?? "",
      name_th: row.name_th ?? "",
      name_en: row.name_en ?? "",
      parent_id: row.parent_id ?? null,
    });
    setFormErr({});
    setIsOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.code?.trim()) e.code = "กรุณาระบุโค้ด";
    if (!form.name_th?.trim()) e.name_th = "กรุณาระบุชื่อ (TH)";
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      const payload = {
        code: form.code?.trim(),
        name_th: form.name_th?.trim(),
        name_en: (form.name_en ?? "").trim() || null,
        parent_id: form.parent_id ?? null,
        id: editingId ?? undefined,
      };

      const res = await fetch(editingId ? "/api/department/update" : "/api/department/create", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || j?.ok === false) throw new Error(j?.error || "บันทึกไม่สำเร็จ");

      await swalToastSuccess(editingId ? "อัปเดตสำเร็จ" : "เพิ่มหน่วยงานสำเร็จ");
      setIsOpen(false);
      setEditingId(null);
      await fetchList();
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: e?.message || "เกิดข้อผิดพลาด" });
    }
  };

  const handleDelete = async (id: number) => {
    const row = rows.find((r) => r.department_id === id);
    const res = await swalConfirm({
      title: "ลบรายการนี้?",
      text: row ? `${row.code} - ${row.name_th}` : "",
    });
    if (!res.isConfirmed) return;
    try {
      const r = await fetch(`/api/department/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "ลบไม่สำเร็จ");
      await swalToastSuccess("ลบรายการแล้ว");
      await fetchList();
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: e?.message || "เกิดข้อผิดพลาด" });
    }
  };

  const jumpToPage = () => {
    const n = parseInt(goto, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      setPage(n);
      setGoto("");
    }
  };

  // สำหรับเลือก Parent เป็น dropdown จากข้อมูลที่มี
  const parentOptions = useMemo(() => {
    // ไม่ให้เลือกตัวเองเวลาที่กำลังแก้ไข
    return rows
      .filter((r) => r.department_id !== editingId)
      .map((r) => ({ id: r.department_id, label: `${r.code} - ${r.name_th}` }));
  }, [rows, editingId]);

  return (
    <div className="w-full overflow-hidden">
      {/* top controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchList()}
            placeholder="ค้นหา: โค้ด / ชื่อหน่วยงาน / หน่วยงานแม่"
            className="h-10 w-full sm:w-[360px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400
                       dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:ring-brand-400/20 dark:focus:border-brand-700"
          />
          {q && (
            <button
              onClick={() => { setQ(""); fetchList(); }}
              className="h-10 px-3 rounded-xl border border-blue-600 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100
                         focus:outline-none focus:ring-2 focus:ring-blue-600/20
                         dark:border-blue-400 dark:text-blue-300 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 dark:focus:ring-blue-400/20"
            >
              ล้าง
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-500 dark:text-white/40">แถว/หน้า</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="h-10 rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-800
                         dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* primary (brand) → เปิดโมดัลเพิ่ม */}
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-medium
                       bg-brand-600 text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30
                       dark:bg-brand-500 dark:hover:bg-brand-400 dark:focus:ring-brand-400/30"
          >
            เพิ่มหน่วยงาน
          </button>
        </div>
      </div>

      {/* table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-gray-50/80 dark:bg-white/[0.04]">
            <tr className="text-left text-gray-600 dark:text-white/60">
              <th className="px-4 py-3 w-[140px]">โค้ด</th>
              <th className="px-4 py-3">ชื่อหน่วยงาน (TH)</th>
              <th className="px-4 py-3">หน่วยงานแม่</th>
              <th className="px-4 py-3 text-right w-[220px]">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400 dark:text-white/40">
                  กำลังโหลด...
                </td>
              </tr>
            ) : errMsg ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-red-500">
                  โหลดข้อมูลผิดพลาด: {errMsg}
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400 dark:text-white/40">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr
                  key={r.department_id}
                  className="hover:bg-gray-50/70 dark:hover:bg-white/[0.04] text-gray-800 dark:text-white/90"
                >
                  <td className="px-4 py-3 font-medium">{r.code}</td>
                  <td className="px-4 py-3">{r.name_th}</td>
                  <td className="px-4 py-3">{r.parent_name || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {/* outline (brand) */}
                      <button
                        onClick={() => openEdit(r.department_id)}
                        className="h-9 px-3 rounded-lg border text-xs font-medium
                                   border-brand-500 text-brand-700 bg-white hover:bg-brand-50
                                   focus:outline-none focus:ring-2 focus:ring-brand-500/20
                                   dark:border-brand-400 dark:text-brand-300 dark:bg-transparent dark:hover:bg-gray-800 dark:focus:ring-brand-400/20"
                      >
                        แก้ไข
                      </button>
                      {/* danger outline (red, พื้นจาง) */}
                      <button
                        onClick={() => handleDelete(r.department_id)}
                        className="h-9 px-3 rounded-lg border text-xs font-medium
                                   border-red-500 text-red-700 bg-red-50 hover:bg-red-100
                                   focus:outline-none focus:ring-2 focus:ring-red-500/20
                                   dark:border-red-400 dark:text-red-300 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:focus:ring-red-400/20"
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

      {/* footer controls */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-xs text-gray-600 dark:text-white/60">
          แสดง <span className="font-medium">{total === 0 ? 0 : fromIdx + 1}</span> –
          <span className="font-medium"> {toIdx}</span> จาก
          <span className="font-medium"> {total}</span> รายการ
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="h-9 px-3 rounded-lg border bg-white text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50
                       dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/80 dark:hover:bg-gray-800"
            onClick={() => setPage(1)}
            disabled={current === 1}
            aria-label="หน้าแรก"
          >
            « หน้าแรก
          </button>
          <button
            className="h-9 px-3 rounded-lg border bg-white text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50
                       dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/80 dark:hover:bg-gray-800"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            aria-label="ก่อนหน้า"
          >
            ‹ ก่อนหน้า
          </button>

          {pageWindow.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-9 min-w-[38px] px-3 rounded-lg border text-xs
                         dark:border-gray-700
                         ${
                           n === current
                             ? "bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-400 dark:text-gray-900 dark:hover:bg-brand-300"
                             : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-white/[0.03] dark:text-white/80 dark:hover:bg-gray-800"
                         }`}
              aria-current={n === current ? "page" : undefined}
            >
              {n}
            </button>
          ))}

          <button
            className="h-9 px-3 rounded-lg border bg-white text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50
                       dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/80 dark:hover:bg-gray-800"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
            aria-label="ถัดไป"
          >
            ถัดไป ›
          </button>
          <button
            className="h-9 px-3 rounded-lg border bg-white text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50
                       dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/80 dark:hover:bg-gray-800"
            onClick={() => setPage(totalPages)}
            disabled={current === totalPages}
            aria-label="หน้าสุดท้าย"
          >
            หน้าสุดท้าย »
          </button>

          {/* goto page */}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-gray-600 dark:text-white/60">ไปหน้า</span>
            <input
              value={goto}
              onChange={(e) => setGoto(e.target.value.replace(/\D+/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && jumpToPage()}
              placeholder={`${current}/${totalPages}`}
              className="h-9 w-16 rounded-lg border border-gray-200 bg-white px-2 text-sm text-center text-gray-800
                         dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            />
            <button
              onClick={jumpToPage}
              className="h-9 px-3 rounded-lg border bg-white text-xs text-gray-700 hover:bg-gray-50
                         dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/80 dark:hover:bg-gray-800"
            >
              ไป
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: เพิ่ม/แก้ไข */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">{editingId ? "แก้ไขหน่วยงาน" : "เพิ่มหน่วยงาน"}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ปิด
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-200">โค้ด</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm
                             bg-white text-gray-900 border-gray-300 placeholder:text-gray-400
                             dark:bg-gray-900 dark:text-white dark:border-gray-700"
                />
                {formErr.code && <p className="mt-1 text-xs text-red-600">{formErr.code}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-200">ชื่อ (TH)</label>
                <input
                  value={form.name_th}
                  onChange={(e) => setForm((s) => ({ ...s, name_th: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm
                             bg-white text-gray-900 border-gray-300 placeholder:text-gray-400
                             dark:bg-gray-900 dark:text-white dark:border-gray-700"
                />
                {formErr.name_th && <p className="mt-1 text-xs text-red-600">{formErr.name_th}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-200">ชื่อ (EN)</label>
                <input
                  value={form.name_en ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, name_en: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm
                             bg-white text-gray-900 border-gray-300 placeholder:text-gray-400
                             dark:bg-gray-900 dark:text-white dark:border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-200">หน่วยงานแม่ (Parent)</label>
                <select
                  value={form.parent_id ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((s) => ({ ...s, parent_id: v === "" ? null : Number(v) }));
                  }}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm
                             bg-white text-gray-900 border-gray-300
                             dark:bg-gray-900 dark:text-white dark:border-gray-700"
                >
                  <option value="">— ไม่มี —</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium
                           border border-blue-600 text-blue-700 bg-blue-50 hover:bg-blue-100
                           focus:outline-none focus:ring-2 focus:ring-blue-600/20
                           dark:border-blue-400 dark:text-blue-300 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 dark:focus:ring-blue-400/20"
              >
                ยกเลิก
              </button>
              <button
                onClick={save}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium
                           bg-brand-600 text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30
                           dark:bg-brand-500 dark:hover:bg-brand-400 dark:focus:ring-brand-400/30"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
