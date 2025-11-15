// src/api/_common/mysql.ts (หรือไฟล์เดิมของคุณ)
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";

async function getConn() {
  return mysql.createConnection({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME || "hr",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    charset: "utf8mb4_general_ci",
  });
}

const ENTITY_TABLE_MAP: Record<string, string> = {
  "prefix-name": "prefix_name",
  gender: "gender",
  nationality: "nationality",
  country: "country",
  "grad-level": "grad_level",
  "time-contract": "time_contract",
  "staff-type": "staff_type",
  "substaff-type": "substaff_type",
  budget: "budget",
  "admin-position": "admin_position",
  "academic-standing": "academic_standing",
  "scholar-order-type": "scholar_order_type",
  "support-level": "support_level",
  "movement-type": "movement_type",
  "address-codebook": "address_codebook",
};

export function tableFor(entity: string) {
  const t = ENTITY_TABLE_MAP[entity];
  if (!t) throw new Error(`Unknown entity '${entity}'`);
  return t;
}

export type ColumnInfo = {
  Field: string;
  Type: string;
  Null: "YES" | "NO";
  Key: "" | "PRI" | "UNI" | "MUL";
  Default: string | null;
  Extra: string;
};

/** ดึงโครงสร้างคอลัมน์ของตารางด้วย DESCRIBE (เปิด–ปิด conn ภายในฟังก์ชัน) */
export async function describeTable(table: string): Promise<ColumnInfo[]> {
  let conn: mysql.Connection | null = null;
  try {
    conn = await getConn();
    const [rows] = await conn.query<RowDataPacket[]>(
      `DESCRIBE \`${table}\``
    );
    return rows as unknown as ColumnInfo[];
  } finally {
    try { await conn?.end(); } catch {}
  }
}

export function primaryKey(columns: ColumnInfo[]): string {
  return columns.find((c) => c.Key === "PRI")?.Field || "id";
}

export function isAutoIncrement(columns: ColumnInfo[], field: string) {
  const col = columns.find((c) => c.Field === field);
  return !!col && /auto_increment/i.test(col.Extra);
}

export function stringColumns(columns: ColumnInfo[]): string[] {
  const s = columns
    .filter((c) => /char|text|enum|set/i.test(c.Type))
    .map((c) => c.Field);
  return s.length ? s : columns.map((c) => c.Field);
}

/**
 * กรอง payload ให้เหลือเฉพาะฟิลด์ที่อยู่ในตาราง
 * - includePk=false จะข้าม PK ที่เป็น auto_increment
 */
export function filterPayloadToTable(
  payload: any,
  columns: ColumnInfo[],
  includePk = true
) {
  const allowed = new Set(columns.map((c) => c.Field));
  const out: any = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (!allowed.has(k)) continue;
    const col = columns.find((c) => c.Field === k)!;
    if (!includePk && col.Key === "PRI" && /auto_increment/i.test(col.Extra)) {
      continue;
    }
    out[k] = v;
  }
  return out;
}
