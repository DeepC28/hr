// src/app/manage/layout.tsx

import React from "react";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import SidebarPadding from "@/layout/SidebarPadding";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ===== เช็ค session / role ด้านบนสุดของ layout =====
  const session = await getServerSession(authOptions);

  // ยังไม่ได้ login -> ส่งไปหน้า signin
  if (!session) {
    redirect("/signin");
  }

  const role = (session.user as any)?.role ?? "user";

  // ไม่ใช่ admin -> ห้ามเข้า /manage ส่งกลับหน้า /
  if (role !== "admin") {
    redirect("/");
  }

  // ===== ผ่านเงื่อนไขแล้วค่อย render layout ปกติ =====
  return (
    <>
      {/* Sidebar ตรึงซ้ายบน */}
      <AppSidebar />

      {/* คุม padding-left ตามความกว้าง sidebar แบบไดนามิก */}
      <SidebarPadding>
        {/* Header เลื่อนไปทางขวาเท่า sidebar */}
        <div className="lg:pl-[var(--sidebar-w)]">
          {/* ส่ง session จาก server ลงไปให้ AppHeader */}
          <AppHeader session={session} />
        </div>

        {/* พื้นที่เนื้อหา */}
        <main className="pt-16 lg:pl-[var(--sidebar-w)]">
          <div className="px-4 pb-6 lg:px-6">{children}</div>
        </main>
      </SidebarPadding>
    </>
  );
}
