import { queryRows, queryOne } from "@/lib/db";

export type DbUserAuth = {
  user_id: number;
  person_id: number | null;
  username: string;
  email: string | null;
  password_hash: string;
  is_active: 0 | 1;
  roles: string[];
  primary_role: string;
};

export async function getUserByUsername(username: string): Promise<DbUserAuth | null> {
  const u = await queryOne<any>(
    `SELECT user_id, person_id, username, email, password_hash, is_active
     FROM users
     WHERE username = ?
     LIMIT 1`,
    [username]
  );
  if (!u) return null;

  const rs = await queryRows<any>(
    `SELECT r.role_name
     FROM user_roles ur
     JOIN roles r ON r.role_id = ur.role_id
     WHERE ur.user_id = ?`,
    [u.user_id]
  );
  const roles = rs.map((x) => String(x.role_name));

  // กติกา primary role แบบง่าย: ถ้ามี admin/superadmin ให้ถือว่า admin
  const primary_role = roles.includes("superadmin")
    ? "superadmin"
    : roles.includes("admin")
      ? "admin"
      : roles[0] ?? "user";

  return {
    user_id: Number(u.user_id),
    person_id: u.person_id === null ? null : Number(u.person_id),
    username: String(u.username),
    email: u.email ? String(u.email) : null,
    password_hash: String(u.password_hash),
    is_active: Number(u.is_active) as 0 | 1,
    roles,
    primary_role,
  };
}