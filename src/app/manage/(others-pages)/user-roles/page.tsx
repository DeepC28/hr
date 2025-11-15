
import React from "react";
import PageShell from "@/components/PageShell";
import TableComp from "@/components/tables/user-roles";

export default function Page() {
  return (
    <PageShell title="กำหนดบทบาทให้ผู้ใช้">
      <TableComp />
    </PageShell>
  );
}