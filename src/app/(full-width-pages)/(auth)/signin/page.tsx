"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) router.push("/");
    else {
      const data = await res.json();
      setError(data.message || "Login failed");
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-sm space-y-5"
    >
      <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100">
        เข้าสู่ระบบ
      </h1>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
          ชื่อผู้ใช้
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 
                     bg-transparent text-gray-900 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="กรอกชื่อผู้ใช้"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
          รหัสผ่าน
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 
                     bg-transparent text-gray-900 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="กรอกรหัสผ่าน"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition"
      >
        เข้าสู่ระบบ
      </button>
    </form>
  );
}
