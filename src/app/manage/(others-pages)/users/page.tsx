
import React from "react";
import PageShell from "@/components/PageShell";
import TableComp from "@/components/tables/users";

export default function Page() {
  return (
    <PageShell title="ผู้ใช้งาน">
      <TableComp />
    </PageShell>
  );
}