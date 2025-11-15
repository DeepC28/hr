"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Edu = {
  education_id:number;
  grad_lev_id:number|null;
  degree_name:string|null;
  major_name:string|null;
  university_name:string|null;
  grad_date:string|null;
  country_id:number|null;
};

export default function EducationPage(){
  const { id } = useParams<{id:string}>();
  const [items,setItems] = useState<Edu[]>([]);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState<string|null>(null);
  const [adding,setAdding] = useState(false);
  const [form,setForm] = useState<Partial<Edu>>({});

  const load = async ()=>{
    try{
      setLoading(true);
      const res = await fetch(`/api/person/${id}/education`, { cache:"no-store" });
      if(!res.ok) throw new Error("โหลดการศึกษาไม่สำเร็จ");
      const data = await res.json();
      setItems(data);
    }catch(e:any){
      setErr(e?.message||"ผิดพลาด");
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[id]);

  const add = async ()=>{
    try{
      setAdding(true);
      const res = await fetch(`/api/person/${id}/education`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(form),
      });
      if(!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.message || "เพิ่มไม่สำเร็จ");
      }
      setForm({});
      await load();
    }catch(e:any){
      setErr(e?.message||"ผิดพลาด");
    }finally{
      setAdding(false);
    }
  };

  const del = async (education_id:number)=>{
    if(!confirm("ลบรายการนี้?")) return;
    const res = await fetch(`/api/person/education/${education_id}`, { method:"DELETE" });
    if(!res.ok){
      const j = await res.json().catch(()=>({}));
      alert(j?.message || "ลบไม่สำเร็จ"); return;
    }
    await load();
  };

  if(loading) return <div>กำลังโหลด…</div>;
  if(err) return <div className="text-red-500">{err}</div>;

  const field = "rounded-xl px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900";

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={field} placeholder="ปริญญา (degree_name)" value={form.degree_name||""}
               onChange={e=>setForm(s=>({...s, degree_name:e.target.value}))}/>
        <input className={field} placeholder="สาขา (major_name)" value={form.major_name||""}
               onChange={e=>setForm(s=>({...s, major_name:e.target.value}))}/>
        <input className={field} placeholder="มหาวิทยาลัย" value={form.university_name||""}
               onChange={e=>setForm(s=>({...s, university_name:e.target.value}))}/>
        <input className={field} type="date" placeholder="วันที่จบ" value={form.grad_date||""}
               onChange={e=>setForm(s=>({...s, grad_date:e.target.value||null}))}/>
      </div>
      <div>
        <button className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                onClick={add} disabled={adding}>
          {adding ? "กำลังเพิ่ม..." : "เพิ่ม"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-800">
              <th className="py-2">วุฒิการศึกษา</th>
              <th className="py-2">สาขา</th>
              <th className="py-2">มหาวิทยาลัย</th>
              <th className="py-2">วันที่จบ</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(it=>(
              <tr key={it.education_id} className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-2">{it.degree_name||"-"}</td>
                <td className="py-2">{it.major_name||"-"}</td>
                <td className="py-2">{it.university_name||"-"}</td>
                <td className="py-2">{it.grad_date||"-"}</td>
                <td className="py-2">
                  <button className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700"
                          onClick={()=>del(it.education_id)}>ลบ</button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td className="py-4 text-center text-gray-500" colSpan={5}>ยังไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
