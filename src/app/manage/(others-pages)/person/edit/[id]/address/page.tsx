"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";

type AddressForm = {
  home_no: string | null;
  moo: string | null;
  street: string | null;
  sub_district_id: string | null;
  zipcode: string | null;
};

export default function AddressPage() {
  const { id } = useParams<{ id: string }>();
  const [f, setF] = useState<AddressForm|null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async ()=>{
      try{
        setLoading(true);
        const res = await fetch(`/api/person/${id}/address`, { cache:"no-store" });
        const body = await res.json().catch(()=> ({}));
        if(!res.ok){
          if (res.status === 404) throw new Error("ไม่พบบุคคลตามรหัสที่ระบุ");
          throw new Error(body?.message || `โหลดที่อยู่ไม่สำเร็จ (HTTP ${res.status})`);
        }
        setF(body);
      }catch(e:any){
        setErr(e?.message||"ผิดพลาด");
      }finally{
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (k:keyof AddressForm, v:any)=> setF(s=> s ? ({...s,[k]:v}) : s);
  const canSave = useMemo(()=> !!f, [f]);

  const field =
    "w-full rounded-xl px-3 py-2 outline-none transition " +
    "bg-white text-gray-900 placeholder-gray-400 " +
    "dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 " +
    "border border-gray-300 dark:border-gray-700 " +
    "focus:border-transparent focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600";
  const label = "text-sm text-gray-700 dark:text-gray-300";
  const btn = "px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800";

  const save = async ()=>{
    if(!f) return;
    setSaving(true); setErr(null);
    try{
      const res = await fetch(`/api/person/${id}/address`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(f),
      });
      const body = await res.json().catch(()=> ({}));
      if(!res.ok) throw new Error(body?.message || `บันทึกไม่สำเร็จ (HTTP ${res.status})`);
    }catch(e:any){
      setErr(e?.message||"ผิดพลาด");
    }finally{
      setSaving(false);
    }
  };

  if (loading) return <div>กำลังโหลด…</div>;
  if (err) return <div className="text-red-500">{err}</div>;
  if (!f) return <div>ไม่พบข้อมูล</div>;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={label}>บ้านเลขที่</span>
          <input className={field} value={f.home_no||""} onChange={e=>set("home_no", e.target.value||null)} />
        </label>
        <label className="grid gap-1">
          <span className={label}>หมู่</span>
          <input className={field} value={f.moo||""} onChange={e=>set("moo", e.target.value||null)} />
        </label>
        <label className="grid gap-1">
          <span className={label}>ถนน</span>
          <input className={field} value={f.street||""} onChange={e=>set("street", e.target.value||null)} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={label}>รหัสตำบล (sub_district_id)</span>
          <input className={field} value={f.sub_district_id||""} onChange={e=>set("sub_district_id", e.target.value||null)} />
        </label>
        <label className="grid gap-1">
          <span className={label}>รหัสไปรษณีย์</span>
          <input className={field} value={f.zipcode||""} onChange={e=>set("zipcode", e.target.value||null)} />
        </label>
      </div>

      {err && <div className="text-sm text-red-500 dark:text-red-400">{err}</div>}
      <div className="flex gap-2">
        <button className={btn+" disabled:opacity-60"} onClick={save} disabled={!canSave || saving}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
