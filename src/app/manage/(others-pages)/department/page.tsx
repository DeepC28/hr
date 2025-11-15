
import React from "react";
import PageShell from "@/components/PageShell";
import TableComp from "@/components/tables/department";

export default function Page() {
  return (
    <PageShell title="หน่วยงาน">
      <TableComp />
    </PageShell>
  );
}