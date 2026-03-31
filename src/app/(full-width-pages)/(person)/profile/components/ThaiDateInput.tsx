// src/app/(full-width-pages)/(person)/profile/components/ThaiDateInput.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void; // ส่งกลับเป็น "วว/ดด/ปปปป" ตามที่ฟอร์มคุณเช็ค
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDDMMYYYYFromISOorYMD(v: string) {
  if (!v) return "";
  // ISO: 1998-02-25T17:00:00.000Z
  const iso = v.includes("T") ? v.slice(0, 10) : v;

  // YYYY-MM-DD
  const m1 = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m1) {
    const [, y, mm, dd] = m1;
    return `${dd}/${mm}/${y}`;
  }

  // already DD/MM/YYYY
  const m2 = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m2) return v;

  return v;
}

export default function ThaiDateInput({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "วว/ดด/ปปปป",
}: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(toDDMMYYYYFromISOorYMD(value || ""));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value;

    // อนุญาตเฉพาะตัวเลขและ /
    v = v.replace(/[^\d/]/g, "");

    // auto slash แบบง่าย ๆ
    if (v.length === 2 && !v.includes("/")) v = v + "/";
    if (v.length === 5 && v.split("/").length === 2) v = v + "/";

    // จำกัดความยาว dd/mm/yyyy
    if (v.length > 10) v = v.slice(0, 10);

    setText(v);
    onChange(v);
  }

  return (
    <input
      type="text"
      value={text}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      inputMode="numeric"
      autoComplete="off"
    />
  );
}
