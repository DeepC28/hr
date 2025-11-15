
import React from "react";
import PageShell from "@/components/PageShell";
import TableComp from "@/components/tables/person";

export default function Page() {
  return (
    <PageShell title="รายชื่อบุคคล">
      <TableComp />
    </PageShell>
  );
}