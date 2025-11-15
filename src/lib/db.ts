// src/lib/db.ts
import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

/** สร้าง pool ใหม่ตาม ENV */
function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME || "hr",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4_general_ci",
    // ถ้าจะใช้ :named params ค่อยเปิด option นี้ด้วย (ตอนนี้เราใช้ ?)
    // namedPlaceholders: true,
  });
}

/**
 * คืน pool เดิมถ้ามีอยู่; ถ้าถูกปิด/หาย จะสร้างใหม่ให้อัตโนมัติ
 * - ป้องกันปัญหา Hot Reload ของ Next.js ที่ทำให้ pool เดิมโดนปิด
 */
export function getPool(): mysql.Pool {
  const g = global as any;
  if (!g.__mysqlPool) {
    g.__mysqlPool = createPool();
    return g.__mysqlPool as mysql.Pool;
  }
  // บาง runtime จะมี flag _closed หลัง end()
  const maybeClosed = (g.__mysqlPool as any)?._closed === true;
  if (maybeClosed) {
    g.__mysqlPool = createPool();
  }
  return g.__mysqlPool as mysql.Pool;
}

/**
 * helper query แบบสั้น ๆ (optional)
 * ใช้ try/recreate เมื่อเจอ "Pool is closed"
 */
export async function dbQuery<T = any>(sql: string, params?: any[]) {
  const g = global as any;
  try {
    const [rows, fields] = await getPool().query(sql, params);
    return [rows as T, fields] as const;
  } catch (err: any) {
    if (err?.code === "POOL_CLOSED" || /Pool is closed/i.test(err?.message)) {
      g.__mysqlPool = createPool();
      const [rows, fields] = await g.__mysqlPool.query(sql, params);
      return [rows as T, fields] as const;
    }
    throw err;
  }
}
