
import React from "react";

export default function RolesAdd() {
  return (
    <form className="grid gap-4">
      <div className="text-lg font-semibold">เพิ่ม บทบาท</div>

      <label className="grid gap-1">
        <span className="text-sm">ชื่อ</span>
        <input className="border rounded-xl px-3 py-2" placeholder="ระบุชื่อ..." />
      </label>

      <label className="grid gap-1">
        <span className="text-sm">รายละเอียด</span>
        <textarea className="border rounded-xl px-3 py-2" rows={3} placeholder="อธิบายสั้น ๆ..." />
      </label>

      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-xl border dark:border-gray-700" type="submit">บันทึก</button>
        <button className="px-4 py-2 rounded-xl border" type="reset">ล้าง</button>
      </div>
    </form>
  );
}