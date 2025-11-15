import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

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

export async function GET() {
  let conn: mysql.Connection | null = null;
  try {
    conn = await getConn();

    const [budgets] = await conn.query(
      `SELECT budget_id AS id, code, name_th, name_en FROM budget ORDER BY name_th`
    );
    const [timeContracts] = await conn.query(
      `SELECT time_contract_id AS id, code, name_th, name_en FROM time_contract ORDER BY name_th`
    );
    const [adminPositions] = await conn.query(
      `SELECT admin_position_id AS id, code, name_th, name_en FROM admin_position ORDER BY name_th`
    );
    const [academicStandings] = await conn.query(
      `SELECT academicstanding_id AS id, code, name_th, name_en FROM academic_standing ORDER BY name_th`
    );
    const [supportLevels] = await conn.query(
      `SELECT positionlevel_id AS id, code, name_th, name_en FROM support_level ORDER BY name_th`
    );
    const [substaffTypes] = await conn.query(
      `SELECT substafftype_id AS id, code, name_th, name_en FROM substaff_type ORDER BY name_th`
    );
    const [nationalities] = await conn.query(
      `SELECT nationality_id AS id, code, name_th, name_en FROM nationality ORDER BY name_th`
    );
    const [universities] = await conn.query(
      `SELECT univ_id AS id, code, name AS name_th FROM university ORDER BY name`
    );

    return NextResponse.json({
      budgets,
      time_contracts: timeContracts,
      admin_positions: adminPositions,
      academic_standings: academicStandings,
      support_levels: supportLevels,
      substaff_types: substaffTypes,
      nationalities,
      universities,
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "โหลดตัวเลือกไม่สำเร็จ" }, { status: 500 });
  } finally {
    try { await conn?.end(); } catch {}
  }
}
