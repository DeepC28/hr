
import React from "react";

export default function PersonMovementEdit() {
  return (
    <form className="grid gap-4">
      <div className="text-lg font-semibold">แก้ไข การเคลื่อนไหว</div>

      <label className="grid gap-1">
        <span className="text-sm">ชื่อ</span>
        <input className="border rounded-xl px-3 py-2" defaultValue="ค่าตัวอย่าง" />
      </label>

      <label className="grid gap-1">
        <span className="text-sm">รายละเอียด</span>
        <textarea className="border rounded-xl px-3 py-2" rows={3} defaultValue="คำอธิบายตัวอย่าง" />
      </label>

      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-xl border dark:border-gray-700" type="submit">บันทึกการแก้ไข</button>
      </div>
    </form>
  );
}