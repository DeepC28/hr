"use client";
import React from "react";
import { useSidebar } from "@/context/SidebarContext";

type Props = { children: React.ReactNode };

export default function SidebarPadding({ children }: Props) {
  const { isExpanded, isHovered } = useSidebar();

  const sidebarW = (isExpanded || isHovered) ? 290 : 90;

  return (
    <div style={{ ["--sidebar-w" as any]: `${sidebarW}px` }}>
      {children}
    </div>
  );
}
