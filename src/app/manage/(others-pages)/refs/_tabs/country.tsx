"use client";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

type Row = Record<string, any>;
type FieldMeta = { key: string; label: string; type?: "text"|"date"|"number" };

// ปุ่มตามที่ขอ: ลบแบบขอบ/พื้นจาง, ค้นหาสีน้ำเงิน, ตัวอื่นเหมือนเดิม
const btn = {
  primary: "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium " +
           "bg-brand-600 text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 " +
           "dark:bg-brand-500 dark:hover:bg-brand-400 dark:focus:ring-brand-400/30",

  outline: "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium " +
           "border border-brand-500 text-brand-700 hover:bg-brand-50 " +
           "focus:outline-none focus:ring-2 focus:ring-brand-500/20 " +
           "dark:border-brand-400 dark:text-brand-300 dark:hover:bg-gray-800 dark:focus:ring-brand-400/20",

  danger:  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium " +
           "border border-red-500 text-red-700 bg-red-50 hover:bg-red-100 " +
           "focus:outline-none focus:ring-2 focus:ring-red-500/20 " +
           "dark:border-red-400 dark:text-red-300 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:focus:ring-red-400/20",

  search:  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium " +
           "border border-blue-600 text-blue-700 bg-blue-50 hover:bg-blue-100 " +
           "focus:outline-none focus:ring-2 focus:ring-blue-600/20 " +
           "dark:border-blue-400 dark:text-blue-300 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 dark:focus:ring-blue-400/20",
};
const ENTITY = "grad-level";
const FIELDS: FieldMeta[] = [
  { "key": "code",    "label": "รหัส",      "type": "text" },
  { "key": "name_th", "label": "ชื่อ (TH)",  "type": "text" },
  { "key": "name_en", "label": "ชื่อ (EN)",  "type": "text" }
];

function FieldInput({ meta, value, onChange }:{ meta: FieldMeta; value:any; onChange:(v:any)=>void }): JSX.Element {
  const common = "w-full rounded-xl border px-3 py-2 text-sm " +
                 "bg-white text-gray-900 border-gray-300 placeholder:text-gray-400 " +
                 "dark:bg-gray-900 dark:text-white dark:border-gray-700";
  const type = meta.type || "text";
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-900 dark:text-white">${meta.label}</label>
      <input type={type} value={value ?? ""} onChange={(e)=>onChange(e.target.value)} className={common} />
    </div>
  );
}

const TabComp: React.FC = () => {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<Row|null>(null);
  const [form, setForm] = useState<Row>({});
  const [err, setErr] = useState<Record<string,string>>({});

  const columns = useMemo(()=>FIELDS, []);

  const pkGuess = useMemo(()=>{
    const cand = [
      "prefix_id","gender_id","nationality_id","country_id","grad_lev_id",
      "time_contract_id","stafftype_id","substafftype_id","budget_id",
      "admin_position_id","academicstanding_id","scholar_order_id",
      "positionlevel_id","movement_type_id","sub_district_id","id"
    ];
    const k = cand.find(k => rows[0] && (k in rows[0]));
    return k || "id";
  }, [rows]);

  const list = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/${ENTITY}/list${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "LIST failed");
      setRows(Array.isArray(j.rows) ? j.rows : []);
    } catch (e:any) {
      Swal.fire({ icon: "error", title: "โหลดข้อมูลไม่สำเร็จ", text: e?.message || "เกิดข้อผิดพลาด" });
    } finally { setLoading(false); }
  };

  useEffect(()=>{ list(); },[]);

  const openCreate = () => {
    const init: Row = {};
    columns.forEach(f => init[f.key] = "");
    setEditing({});
    setForm(init);
    setErr({});
  };

  const openEdit = (row: Row) => {
    const copy: Row = {};
    columns.forEach(f => copy[f.key] = row[f.key] ?? "");
    copy[pkGuess] = row[pkGuess];
    setEditing(row);
    setForm(copy);
    setErr({});
  };

  const validate = (): boolean => {
    const e: Record<string,string> = {};
    if ("code" in form && !String(form.code).trim()) e.code = "กรุณากรอกรหัส";
    if ("name_th" in form && !String(form.name_th).trim()) e.name_th = "กรุณากรอกชื่อ (TH)";
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) { Swal.fire({ icon: "warning", title: "กรอกข้อมูลไม่ครบ" }); return; }
    const isEdit = !!(editing && editing[pkGuess]);
    const url = isEdit ? `/api/${ENTITY}/update` : `/api/${ENTITY}/create`;
    try {
      const r = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const j = await r.json();
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "บันทึกไม่สำเร็จ");
      Swal.fire({ icon: "success", title: isEdit ? "อัปเดตสำเร็จ" : "เพิ่มรายการสำเร็จ", timer: 900, showConfirmButton: false });
      setEditing(null);
      await list();
    } catch (e:any) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: e?.message || "เกิดข้อผิดพลาด" });
    }
  };

  const askDelete = async (row: Row) => {
    const pk = row[pkGuess];
    const cf = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ?",
      text: "จะลบรายการนี้อย่างถาวร",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        confirmButton: "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border border-red-500 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-400 dark:text-red-300 dark:bg-red-950/30 dark:hover:bg-red-900/40",
        cancelButton:  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border border-gray-300 bg-gray-50 text-gray-900 hover:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800",
      },
    });
    if (!cf.isConfirmed) return;
    try {
      const r = await fetch(`/api/${ENTITY}/delete`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [pkGuess]: pk })
      });
      const j = await r.json();
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "ลบไม่สำเร็จ");
      Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 800, showConfirmButton: false });
      await list();
    } catch (e:any) {
      Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: e?.message || "เกิดข้อผิดพลาด" });
    }
  };

  return (
    <div className="space-y-4 text-gray-900 dark:text-white">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex w-full sm:w-auto items-center gap-2">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==="Enter") list(); }}
            placeholder="ค้นหา..."
            className="w-full sm:w-64 rounded-xl border px-3 py-2 text-sm
                       bg-white text-gray-900 border-gray-300 placeholder:text-gray-400
                       dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />
          <button onClick={list} className={btn.search}>ค้นหา</button>
        </div>
        <div className="sm:ml-auto"><button onClick={openCreate} className={btn.primary}>เพิ่มรายการ</button></div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-3 py-2 text-left text-xs font-medium uppercase">{col.label}</th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-medium uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {loading ? (
              <tr><td className="px-3 py-6 text-sm text-gray-700 dark:text-gray-300" colSpan={columns.length+1}>กำลังโหลด...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-6 text-sm text-gray-700 dark:text-gray-300" colSpan={columns.length+1}>ไม่มีข้อมูล</td></tr>
            ) : rows.map((r,idx)=>(
              <tr key={idx} className="text-gray-900 dark:text-white">
                {columns.map(col=>(
                  <td key={col.key} className="px-3 py-2 text-sm">{String(r[col.key] ?? "")}</td>
                ))}
                <td className="px-3 py-2 text-sm text-right space-x-2">
                  <button onClick={()=>openEdit(r)} className={btn.outline}>แก้ไข</button>
                  <button onClick={()=>askDelete(r)} className={btn.danger}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={()=>setEditing(null)}>
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white p-4" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">{editing && editing[pkGuess] ? "แก้ไขรายการ" : "เพิ่มรายการ"}</h3>
              <button onClick={()=>setEditing(null)} className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">ปิด</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {columns.map((f)=>(
                <div key={f.key}>
                  <FieldInput meta={f} value={form[f.key]} onChange={(v)=>setForm(prev=>({ ...prev, [f.key]: v }))} />
                  {err[f.key] && <p className="mt-1 text-xs text-red-600">{err[f.key]}</p>}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setEditing(null)} className={btn.search}>ยกเลิก</button>
              <button onClick={save} className={btn.primary}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabComp;