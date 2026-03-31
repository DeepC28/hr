// src/lib/mysql.ts
import mysql, { Pool, PoolConnection } from "mysql2/promise";

export type { PoolConnection };

function getEnv(name: string, fallback?: string) {
  const v = process.env[name];
  if (v == null || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

let _pool: Pool | null = null;

export function getPool() {
  if (_pool) return _pool;

  const host = getEnv("MYSQL_HOST", "127.0.0.1");
  const port = Number(getEnv("MYSQL_PORT", "3306"));
  const user = getEnv("MYSQL_USER", "root");
  const password = getEnv("MYSQL_PASSWORD", ""); // ✅ ไม่ให้พังถ้าใช้ root ไม่มีรหัส
  const database = getEnv("MYSQL_DATABASE", "hr");

  _pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: Number(getEnv("MYSQL_CONN_LIMIT", "10")),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    namedPlaceholders: true,
    dateStrings: true, // กัน timezone เพี้ยน
  });

  return _pool;
}

export async function withConn<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}
