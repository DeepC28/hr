"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";

type Option = { id:number|string; name_th:string; name_en?:string; code?:string };

type OptionsPayload = {
  prefix_names: Option[];
  genders: Option[];
  departments: Option[];
  staff_types: Option[];
};

type PersonGeneral = {
  person_id: number;
  prefix_id: string | null;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string | null;
  last_name_en: string | null;
  gender_id: string | null;
  citizen_id: string | null;
  birthday: string | null;
  email: string | null;
  telephone: string | null;
  picture_url: string | null;
  stafftype_id: string | null;
  department_id: string | null;
};

export default function GeneralPage() {
  const { id } = useParams<{ id: string }>();
  const [opts, setOpts] = useState<OptionsPayload>({ prefix_names:[], genders:[], departments:[], staff_types:[] });
  const [f, setF] = useState<PersonGeneral | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [optRes, genRes] = await Promise.all([
          fetch("/api/person/options", { cache:"no-store" }),
          fetch(`/api/person/${id}/general`, { cache:"no-store" }),
        ]);

        const optBody = await optRes.json().catch(()=> ({}));
        if (!optRes.ok) throw new Error(optBody?.message || `โหลดตัวเลือกไม่สำเร็จ (HTTP ${optRes.status})`);

        const genBody = await genRes.json().catch(()=> ({}));
        if (!genRes.ok) {
          if (genRes.status === 404) throw new Error("ไม่พบบุคคลตามรหัสที่ระบุ");
          throw new Error(genBody?.message || `โหลดข้อมูลบุคคลไม่สำเร็จ (HTTP ${genRes.status})`);
        }

        setOpts(optBody);
        setF(genBody);
      } catch (e:any) {
        setErr(e?.message || "ผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canSave = useMemo(() => f && f.first_name_th.trim() && f.last_name_th.trim(), [f]);

  const field =
    "w-full rounded-xl px-3 py-2 outline-none transition " +
    "bg-white text-gray-900 placeholder-gray-400 " +
    "dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 " +
    "border border-gray-300 dark:border-gray-700 " +
    "focus:border-transparent focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600";
  const label = "text-sm text-gray-700 dark:text-gray-300";
  const btn = "px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800";

  const set = (k: keyof PersonGeneral, v:any)=> setF(s=> s ? ({...s,[k]:v}) : s);

  const save = async ()=>{
    if(!f) return;
    setSaving(true); setErr(null);
    try {
      const res = await fetch(`/api/person/${id}/general`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(f),
      });
      const body = await res.json().catch(()=> ({}));
      if(!res.ok) throw new Error(body?.message || `บันทึกไม่สำเร็จ (HTTP ${res.status})`);
    } catch(e:any) {
      setErr(e?.message||"ผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>กำลังโหลด…</div>;
  if (err) return <div className="text-red-500">{err}</div>;
  if (!f) return <div>ไม่พบข้อมูล</div>;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="grid gap-1">
          <span className={label}>คำนำหน้า</span>
          <select className={field} value={f.prefix_id ?? ""} onChange={e=>set("prefix_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.prefix_names.map(o=>(
              <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={label}>ชื่อ (TH)</span>
          <input className={field} value={f.first_name_th||""} onChange={e=>set("first_name_th", e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className={label}>สกุล (TH)</span>
          <input className={field} value={f.last_name_th||""} onChange={e=>set("last_name_th", e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className={label}>เพศ</span>
          <select className={field} value={f.gender_id ?? ""} onChange={e=>set("gender_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.genders.map(o=>(
              <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="grid gap-1">
          <span className={label}>เลขบัตรประชาชน</span>
          <input className={field} value={f.citizen_id||""} onChange={e=>set("citizen_id", e.target.value.replace(/\D/g,""))} maxLength={13}/>
        </label>
        <label className="grid gap-1">
          <span className={label}>วันเกิด</span>
          <input className={field} type="date" value={f.birthday||""} onChange={e=>set("birthday", e.target.value||null)} />
        </label>
        <label className="grid gap-1">
          <span className={label}>อีเมล</span>
          <input className={field} type="email" value={f.email||""} onChange={e=>set("email", e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className={label}>โทรศัพท์</span>
          <input className={field} value={f.telephone||""} onChange={e=>set("telephone", e.target.value)} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={label}>ประเภทบุคลากร</span>
          <select className={field} value={f.stafftype_id ?? ""} onChange={e=>set("stafftype_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.staff_types.map(o=>(
              <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={label}>หน่วยงานหลัก</span>
          <select className={field} value={f.department_id ?? ""} onChange={e=>set("department_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.departments.map(o=>(
              <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={label}>รูปภาพ (URL)</span>
          <input className={field} value={f.picture_url||""} onChange={e=>set("picture_url", e.target.value)} />
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
