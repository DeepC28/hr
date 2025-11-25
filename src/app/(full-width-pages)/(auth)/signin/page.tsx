// app/auth/signin/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlFromQuery = searchParams.get("callbackUrl");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
      // ไม่ต้องส่ง callbackUrl แล้ว เราจะจัดการเองตาม role
    });

    setLoading(false);

    if (res?.error) {
      setErrorMsg("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    if (res?.ok) {
      // ดึง session ปัจจุบันมาดู role
      const session = await getSession();
      const role = (session?.user as any)?.role ?? "user";

      // ถ้ามี callbackUrl ใน query และอยากให้ admin ก็ใช้ได้เหมือนกัน
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-lg p-8 text-slate-100">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          เข้าสู่ระบบ HR
        </h1>
        <p className="text-sm text-slate-400 mb-6 text-center">
          กรุณากรอกชื่อผู้ใช้และรหัสผ่าน
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

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
    </div>
  );
}
