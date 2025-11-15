// src/app/(manage)/layout.tsx
import React from "react";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import SidebarPadding from "@/layout/SidebarPadding"; // ที่เราสร้างไว้ก่อนหน้า

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Sidebar ตรึงซ้ายบน */}
      <AppSidebar />

      {/* คุม padding-left ตามความกว้าง sidebar แบบไดนามิก */}
      <SidebarPadding>
        {/* Header เลื่อนไปทางขวาเท่า sidebar */}
        <div className="lg:pl-[var(--sidebar-w)]">
          <AppHeader />
        </div>

        {/* พื้นที่เนื้อหา: 
            - เว้นจาก Header ด้วย pt-16 (สูง ~64px)
            - กำหนด gutter ซ้าย/ขวา/ล่าง ให้เท่ากัน: mobile=px-4, desktop=px-6, bottom=pb-6 */}
        <main className="pt-16 lg:pl-[var(--sidebar-w)]">
          <div className="px-4 pb-6 lg:px-6">
            {children}
          </div>
        </main>
      </SidebarPadding>
    </>
  );
}
