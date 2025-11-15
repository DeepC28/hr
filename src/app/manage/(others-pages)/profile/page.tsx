
import React from "react";
import PageShell from "@/components/PageShell";
import TableComp from "@/components/tables/profile";

export default function Page() {
  return (
    <PageShell title="ข้อมูลผู้ใช้">
      <TableComp />
    </PageShell>
  );
}