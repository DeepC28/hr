/**
 * รองรับ input วันที่หลายรูปแบบ:
 * - "YYYY-MM-DD" (ปล่อยผ่าน)
 * - "DD/MM/YYYY" หรือ "DD-MM-YYYY"
 * - ถ้าเป็น พ.ศ. (>2400) จะลบ 543
 * คืนค่าเป็น "YYYY-MM-DD" หรือ null
 */
export function normalizeDate(input: any): string | null {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  if (!s) return null;

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    let dd = Number(m[1]);
    let mm = Number(m[2]);
    let yyyy = Number(m[3]);
    if (yyyy > 2400) yyyy -= 543; // พ.ศ.

    if (mm < 1 || mm > 12) return null;
    if (dd < 1 || dd > 31) return null;

    const iso = `${yyyy.toString().padStart(4, "0")}-${mm.toString().padStart(2, "0")}-${dd
      .toString()
      .padStart(2, "0")}`;
    return iso;
  }

  // Fallback: try Date
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function normalizeDateFields(obj: any, fields: string[]): any {
  if (!obj || typeof obj !== "object") return obj;
  const out: any = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const f of fields) {
    if (f in out) out[f] = normalizeDate(out[f]);
  }
  return out;
}