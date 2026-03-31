// src/app/auth/signup/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ล้าง popup error/success เดิม (Swal จะทับให้อยู่แล้ว)

    // validate ฝั่ง client
    if (!username || !email || !password || !passwordConfirm) {
      Swal.fire({
        icon: "error",
        title: "ข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
      });
      return;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: "error",
        title: "รหัสผ่านสั้นเกินไป",
        text: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
      });
      return;
    }

    if (password !== passwordConfirm) {
      Swal.fire({
        icon: "error",
        title: "ยืนยันรหัสผ่านไม่ตรงกัน",
        text: "กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่านอีกครั้ง",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: "error",
        title: "รูปแบบอีเมลไม่ถูกต้อง",
        text: "กรุณากรอกอีเมลให้ถูกต้อง เช่น name@example.com",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "สมัครสมาชิกไม่สำเร็จ",
          text:
            data.message ||
            "เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "สมัครสมาชิกสำเร็จ",
          text: "กรุณาตรวจสอบอีเมลของคุณเพื่อกดยืนยันก่อนใช้งานระบบ",
        });

        // เคลียร์ฟอร์ม
        setUsername("");
        setEmail("");
        setPassword("");
        setPasswordConfirm("");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
        text: "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // ไม่ใช้ min-h-screen / bg อีก ปล่อยให้ layout ภายนอกจัดการ
    <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-center">
        สมัครสมาชิก
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
        สร้างบัญชีใหม่เพื่อเข้าใช้งานระบบ HR
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            className="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            อีเมล (ใช้รับลิงก์ยืนยัน)
          </label>
          <input
            id="email"
            type="email"
            className="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            className="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label
            htmlFor="passwordConfirm"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            ยืนยันรหัสผ่าน
          </label>
          <input
            id="passwordConfirm"
            type="password"
            className="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 text-sm font-medium transition"
        >
          {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>
    </div>
  );
}
