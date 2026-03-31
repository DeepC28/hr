// src/app/api/profile/options/route.ts
import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Opt = { value: number; label: string };

function toOpt(rows: any[], valueKey: string, labelKey: string): Opt[] {
  return (rows || []).map((r) => ({
    value: Number(r[valueKey]),
    label: String(r[labelKey] ?? ""),
  }));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const [prefixRows] = await dbQuery<any[]>(
      "SELECT prefix_id, name_th FROM prefix_name ORDER BY name_th",
    );
    const [genderRows] = await dbQuery<any[]>(
      "SELECT gender_id, name_th FROM gender ORDER BY gender_id",
    );
    const [natRows] = await dbQuery<any[]>(
      "SELECT nationality_id, name_th FROM nationality ORDER BY name_th",
    );
    const [staffTypeRows] = await dbQuery<any[]>(
      "SELECT stafftype_id, name_th FROM staff_type ORDER BY name_th",
    );
    const [deptRows] = await dbQuery<any[]>(
      "SELECT department_id, name_th FROM department ORDER BY name_th",
    );

    return NextResponse.json({
      prefix: toOpt(prefixRows, "prefix_id", "name_th"),
      gender: toOpt(genderRows, "gender_id", "name_th"),
      nationality: toOpt(natRows, "nationality_id", "name_th"),
      staff_type: toOpt(staffTypeRows, "stafftype_id", "name_th"),
      department: toOpt(deptRows, "department_id", "name_th"),
    });
  } catch (err: any) {
    console.error("GET /api/profile/options error:", err);
    return NextResponse.json({ message: "db_error" }, { status: 500 });
  }
}
