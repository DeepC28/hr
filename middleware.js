// middleware.js
import { getToken } from "next-auth/jwt";
import mysql from "mysql2/promise";

const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

export default async function middleware(req, res, next) {
  const token = await getToken({ req });
  if (!token) {
    return res.redirect("/auth/signin");
  }

  const connection = await mysql.createConnection(connectionConfig);

  // ตรวจสอบ session_token ในฐานข้อมูล
  const [rows] = await connection.execute(
    "SELECT session_token FROM user WHERE id = ?",
    [token.id]
  );

  await connection.end();

  if (rows.length === 0 || rows[0].session_token !== token.session_token) {
    // หาก session_token ไม่ตรงกัน ให้เด้งผู้ใช้
    return res.redirect("/auth/signin");
  }

  // อนุญาตให้ทำงานต่อ
  next();
}
