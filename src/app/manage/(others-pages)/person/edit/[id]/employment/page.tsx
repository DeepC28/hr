"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Option = { id:number|string; code?:string; name_th:string; name_en?:string };

type Opts = {
  budgets: Option[];
  time_contracts: Option[];
  admin_positions: Option[];
  academic_standings: Option[];
  support_levels: Option[];
  substaff_types: Option[];
  nationalities: Option[];
  universities: Option[];
};

type EmpForm = {
  univ_id: string|null;
  nationality_id: string|null;
  stafftype_id: string|null;
  substafftype_id: string|null;

  time_contract_id: string|null;
  contract_end_date: string|null;
  budget_id: string|null;

  admin_position_id: string|null;
  academicstanding_id: string|null;
  positionlevel_id: string|null;

  position_work: string|null;
  rate_number: string|null;
  status_text: string|null;

  date_inwork: string|null;
  date_start_this_u: string|null;

  income_amount: string|null;
  cost_of_living: string|null;
};

export default function EmploymentPage(){
  const { id } = useParams<{id:string}>();
  const [opts, setOpts] = useState<Opts>({ budgets:[], time_contracts:[], admin_positions:[], academic_standings:[], support_levels:[], substaff_types:[], nationalities:[], universities:[] });
  const [f, setF] = useState<EmpForm|null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  useEffect(()=>{
    (async ()=>{
      try{
        setLoading(true);
        const [o, d] = await Promise.all([
          fetch("/api/person/employment-options", { cache:"no-store" }),
          fetch(`/api/person/${id}/employment`, { cache:"no-store" }),
        ]);

        const oBody = await o.json().catch(()=> ({}));
        if(!o.ok) throw new Error(oBody?.message || `โหลดตัวเลือกไม่สำเร็จ (HTTP ${o.status})`);

        const dBody = await d.json().catch(()=> ({}));
        if(!d.ok){
          if (d.status === 404) throw new Error("ไม่พบบุคคลตามรหัสที่ระบุ");
          throw new Error(dBody?.message || `โหลดข้อมูลไม่สำเร็จ (HTTP ${d.status})`);
        }

        setOpts(oBody);
        setF(dBody);
      }catch(e:any){
        setErr(e?.message||"ผิดพลาด");
      }finally{
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (k:keyof EmpForm, v:any)=> setF(s=> s ? ({...s,[k]:v}) : s);
  const canSave = useMemo(()=> !!f, [f]);

  const field =
    "w-full rounded-xl px-3 py-2 outline-none transition " +
    "bg-white text-gray-900 placeholder-gray-400 " +
    "dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 " +
    "border border-gray-300 dark:border-gray-700 " +
    "focus:border-transparent focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600";
  const label = "text-sm text-gray-700 dark:text-gray-300";
  const btn = "px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800";
  const select = field + " appearance-none";

  const save = async ()=>{
    if(!f) return;
    setSaving(true); setErr(null);
    try{
      const res = await fetch(`/api/person/${id}/employment`, {
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

  if(loading) return <div>กำลังโหลด…</div>;
  if(err) return <div className="text-red-500">{err}</div>;
  if(!f) return <div>ไม่พบข้อมูล</div>;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={label}>สังกัดมหาวิทยาลัย</span>
          <select className={select} value={f.univ_id ?? ""} onChange={e=>set("univ_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.universities.map(o=> <option key={o.id} value={o.id}>{o.name_th || o.code || o.id}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={label}>สัญชาติ</span>
          <select className={select} value={f.nationality_id ?? ""} onChange={e=>set("nationality_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.nationalities.map(o=> <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={label}>กลุ่มย่อย (substaff)</span>
          <select className={select} value={f.substafftype_id ?? ""} onChange={e=>set("substafftype_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.substaff_types.map(o=> <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={label}>รูปแบบสัญญา</span>
          <select className={select} value={f.time_contract_id ?? ""} onChange={e=>set("time_contract_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.time_contracts.map(o=> <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>)}
          </select>
        </label>

        <label className="grid gap-1">
          <span className={label}>วันสิ้นสุดสัญญา</span>
          <input className={field} type="date" value={f.contract_end_date||""} onChange={e=>set("contract_end_date", e.target.value||null)} />
        </label>

        <label className="grid gap-1">
          <span className={label}>งบประมาณ</span>
          <select className={select} value={f.budget_id ?? ""} onChange={e=>set("budget_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.budgets.map(o=> <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={label}>ตำแหน่งบริหาร</span>
          <select className={select} value={f.admin_position_id ?? ""} onChange={e=>set("admin_position_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.admin_positions.map(o=> <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>)}
          </select>
        </label>

        <label className="grid gap-1">
          <span className={label}>ระดับวิชาการ</span>
          <select className={select} value={f.academicstanding_id ?? ""} onChange={e=>set("academicstanding_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.academic_standings.map(o=> <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>)}
          </select>
        </label>

        <label className="grid gap-1">
          <span className={label}>ระดับตำแหน่งสนับสนุน</span>
          <select className={select} value={f.positionlevel_id ?? ""} onChange={e=>set("positionlevel_id", e.target.value||null)}>
            <option value="">— เลือก —</option>
            {opts.support_levels.map(o=> <option key={o.id} value={o.id}>{o.name_th || o.name_en || o.code || o.id}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={label}>ตำแหน่งงาน</span>
          <input className={field} value={f.position_work||""} onChange={e=>set("position_work", e.target.value)} />
        </label>

        <label className="grid gap-1">
          <span className={label}>เลขอัตรา (rate_number)</span>
          <input className={field} inputMode="numeric" value={f.rate_number||""} onChange={e=>set("rate_number", e.target.value.replace(/\D/g,""))} />
        </label>

        <label className="grid gap-1">
          <span className={label}>สถานะ (ข้อความ)</span>
          <input className={field} value={f.status_text||""} onChange={e=>set("status_text", e.target.value)} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className={label}>วันที่เริ่มงาน</span>
          <input className={field} type="date" value={f.date_inwork||""} onChange={e=>set("date_inwork", e.target.value||null)} />
        </label>

        <label className="grid gap-1">
          <span className={label}>วันที่เริ่มที่หน่วยงานนี้</span>
          <input className={field} type="date" value={f.date_start_this_u||""} onChange={e=>set("date_start_this_u", e.target.value||null)} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 sm:col-span-1 col-span-3">
          {/* ช่องว่างให้กริดสมดุล */}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className={label}>รายได้ (income_amount)</span>
          <input className={field} inputMode="decimal" value={f.income_amount||""} onChange={e=>set("income_amount", e.target.value)} />
        </label>
        <label className={label + " grid gap-1"}>
          <span className={label}>ค่าครองชีพ (cost_of_living)</span>
          <input className={field} inputMode="decimal" value={f.cost_of_living||""} onChange={e=>set("cost_of_living", e.target.value)} />
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
