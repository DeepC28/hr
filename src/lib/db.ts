import mysql from "mysql2/promise";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const pool = mysql.createPool({
  host: mustEnv("DB_HOST"),
  port: Number(process.env.DB_PORT ?? 3306),
  user: mustEnv("DB_USER"),
  password: mustEnv("DB_PASSWORD"),
  database: mustEnv("DB_NAME"),
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

export type SqlParams = (string | number | boolean | null | Date)[];

export async function queryRows<T = any>(sql: string, params: SqlParams = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params: SqlParams = []): Promise<T | null> {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

export async function exec(sql: string, params: SqlParams = []): Promise<{ affectedRows: number; insertId?: number }>{
  const [res] = await pool.execute(sql, params);
  const r: any = res;
  return { affectedRows: r.affectedRows ?? 0, insertId: r.insertId };
}