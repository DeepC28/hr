
import React from "react";

export default function MovementTypeTable() {
  return (
    <div className="w-full overflow-auto">
      <div className="text-sm text-gray-500">ตาราง: ประเภทการเคลื่อนไหว</div>
      <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-sm">
        <ul className="list-disc pl-5 space-y-1">
          <li>คอลัมน์ตัวอย่าง A</li>
          <li>คอลัมน์ตัวอย่าง B</li>
          <li>คอลัมน์ตัวอย่าง C</li>
        </ul>
      </div>
    </div>
  );
}