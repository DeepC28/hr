// src/components/SessionWatcher.tsx
"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function SessionWatcher() {
  useEffect(() => {
    let timer: number | undefined;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/session/check", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          await signOut({
            redirect: true,
            callbackUrl: "/signin",
          });
          return;
        }

        const data = await res.json();
        if (!data.ok) {
          await signOut({
            redirect: true,
            callbackUrl: "/signin",
          });
        }
      } catch (err) {
        console.error("SessionWatcher error:", err);
      }
    };

    // เช็คทันทีตอน mount
    checkSession();

    // เช็คทุก 30 วิ (ปรับได้ตามใจ)
    timer = window.setInterval(checkSession, 30_000);

    // เวลา tab กลับมาโฟกัส
    const handleVisibility = () => {
      if (!document.hidden) {
        checkSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
