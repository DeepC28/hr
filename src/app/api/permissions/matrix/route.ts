// src/app/api/permissions/matrix/route.ts
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { dbQuery } from "@/lib/db";

export const runtime = "nodejs";

interface RoleRow extends RowDataPacket {
  role_id: number;
  role_name: string;
  description: string | null;
  is_system: number; // tinyint(1)
}

interface PermissionRow extends RowDataPacket {
  permission_id: number;
  perm_key: string;
  description: string | null;
}

interface RolePermissionRow extends RowDataPacket {
  role_id: number;
  permission_id: number;
}

export async function GET() {
  try {
    const [roleRows] = await dbQuery<RoleRow[]>(
      `
      SELECT
        role_id,
        role_name,
        description,
        is_system
      FROM roles
      ORDER BY is_system DESC, role_id ASC
      `,
      [],
    );

    const [permRows] = await dbQuery<PermissionRow[]>(
      `
      SELECT
        permission_id,
        perm_key,
        description
      FROM permissions
      ORDER BY perm_key ASC
      `,
      [],
    );

    const [rpRows] = await dbQuery<RolePermissionRow[]>(
      `
      SELECT
        role_id,
        permission_id
      FROM role_permissions
      `,
      [],
    );

    const roles = roleRows.map((r) => ({
      role_id: r.role_id,
      role_name: r.role_name,
      description: r.description,
      is_system: !!r.is_system,
    }));

    const permissions = permRows.map((p) => ({
      permission_id: p.permission_id,
      perm_key: p.perm_key,
      description: p.description,
    }));

    return NextResponse.json(
      {
        roles,
        permissions,
        rolePermissions: rpRows,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Permissions matrix GET error:", err);
    return NextResponse.json(
      { message: "ไม่สามารถโหลดข้อมูล permissions matrix ได้" },
      { status: 500 },
    );
  }
}
