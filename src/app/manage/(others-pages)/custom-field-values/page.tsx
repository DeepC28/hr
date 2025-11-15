
import React from "react";
import PageShell from "@/components/PageShell";
import TableComp from "@/components/tables/custom-field-values";

export default function Page() {
  return (
    <PageShell title="ค่าฟิลด์">
      <TableComp />
    </PageShell>
  );
}