import { NextRequest, NextResponse } from "next/server";
import mysql, { ResultSetHeader } from "mysql2/promise";

async function getConn() {
  return mysql.createConnection({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: "hr",
    charset: "utf8mb4_general_ci",
  });
}

type Payload = {
  prefix_name_id?: string;
  first_name_th: string;
  last_name_th: string;
  gender_id?: string;
  citizen_id?: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  department_id?: string;
  staff_type_id?: string;
  picture_url?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: Payload = await req.json();

    // validate ง่าย ๆ
    if (!body.first_name_th?.trim() || !body.last_name_th?.trim()) {
      return NextResponse.json(
        { message: "กรอกชื่อและสกุล" },
        { status: 400 }
      );
    }

    const conn = await getConn();

    // ปรับชื่อคอลัมน์ให้ตรงสคีม่าของคุณ ถ้าต่างจากนี้
    const [res] = await conn.execute<ResultSetHeader>(
      `
      INSERT INTO person
        (prefix_name_id, first_name_th, last_name_th, gender_id,
         citizen_id, birth_date, email, phone,
         department_id, staff_type_id, picture_url, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        body.prefix_name_id || null,
        body.first_name_th || "",
        body.last_name_th || "",
        body.gender_id || null,
        body.citizen_id || null,
        body.birth_date || null,
        body.email || null,
        body.phone || null,
        body.department_id || null,
        body.staff_type_id || null,
        body.picture_url || null,
      ]
    );

    await conn.end();

    return NextResponse.json({ person_id: res.insertId });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "บันทึกไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
