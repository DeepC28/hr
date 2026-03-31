// app/auth/signin/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlFromQuery = searchParams.get("callbackUrl");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      Swal.fire({
        icon: "error",
        title: "ข้อมูลไม่ครบ",
        text: "กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ",
      });
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (res?.error) {
      console.warn("SignIn error:", res.error);

      // ตรงนี้จะดู code จากฝั่ง NextAuth ที่เราโยน Error ไว้ด้านบน
      if (res.error === "EMAIL_NOT_VERIFIED") {
        Swal.fire({
          icon: "warning",
          title: "ยังไม่ยืนยันอีเมล",
          text: "กรุณาตรวจสอบกล่องอีเมลของคุณ แล้วกดลิงก์ยืนยันก่อนเข้าสู่ระบบ",
        });
        return;
      }

      if (res.error === "ACCOUNT_INACTIVE") {
        Swal.fire({
          icon: "error",
          title: "บัญชีถูกปิดใช้งาน",
          text: "บัญชีผู้ใช้นี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
        });
        return;
      }

      // เคสอื่น ๆ (รวมถึง INVALID_CREDENTIALS / CredentialsSignin)
      Swal.fire({
        icon: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      });
      return;
    }

    if (res?.ok) {
      const session = await getSession();
      const role = (session?.user as any)?.role ?? "user";

      if (callbackUrlFromQuery && role !== "admin") {
        router.push(callbackUrlFromQuery);
        return;
      }

      if (role === "admin") {
        router.push("/manage");
      } else {
        router.push("/");
      }
    }
  };

  return (
    // ให้ layout ภายนอกจัดพื้นหลัง/จัดกึ่งกลาง
    <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-lg p-8 text-slate-100">
      <h1 className="text-2xl font-semibold mb-2 text-center">
        เข้าสู่ระบบ HR
      </h1>
      <p className="text-sm text-slate-400 mb-6 text-center">
        กรุณากรอกชื่อผู้ใช้และรหัสผ่าน
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">ชื่อผู้ใช้</label>
          <input
            type="text"
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">รหัสผ่าน</label>
          <input
            type="password"
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 px-4 py-2 text-sm font-medium"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}
