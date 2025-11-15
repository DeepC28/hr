import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const pool = getPool();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  let sql = `
    SELECT d.department_id, d.code, d.name_th, d.name_en, d.parent_id,
           p.name_th AS parent_name
    FROM department d
    LEFT JOIN department p ON p.department_id = d.parent_id
  `;
  const params: any[] = [];
  if (q) {
    sql += ` WHERE d.code LIKE ? OR d.name_th LIKE ? OR p.name_th LIKE ? `;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY d.code ASC `;

  const [rows] = await pool.query(sql, params);
  return NextResponse.json(rows);
}
