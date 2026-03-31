// src/app/(full-width-pages)/(person)/layout.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession, pickUserIdFromSession } from "@/lib/authUser";

// ✅ layout components (ฝั่ง user)
import AppHeader from "@/layout/AppHeader";
import AppSidebarUser from "@/layout/AppSidebarUser";
import SidebarPadding from "@/layout/SidebarPadding";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/signin?reason=session_missing");
  }

  const role = (session.user as any)?.role ?? "guest";

  const userId = pickUserIdFromSession(session);
  if (!userId) {
    redirect("/signin?reason=missing_user_id");
  }

  // ✅ ใช้ is_active จาก session (ถูกโหลดจาก jwt/loadUserProfile แล้ว)
  const isActive = (session.user as any)?.is_active;
  if (isActive === false || isActive === 0) {
    redirect("/signin?reason=inactive");
  }

  // role guard
  if (role !== "user") {
    redirect("/manage");
  }

  // ✅ ผ่านเงื่อนไขแล้วค่อย render layout แบบมี sidebar/header
  return (
    <>
      {/* Sidebar user */}
      <AppSidebarUser />

      {/* คุม padding-left ตามความกว้าง sidebar แบบไดนามิก */}
      <SidebarPadding>
        {/* Header เลื่อนไปทางขวาเท่า sidebar */}
        <div className="lg:pl-[var(--sidebar-w)]">
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
