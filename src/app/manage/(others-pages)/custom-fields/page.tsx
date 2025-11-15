
import React from "react";
import PageShell from "@/components/PageShell";
import TableComp from "@/components/tables/custom-fields";

export default function Page() {
  return (
    <PageShell title="นิยามฟิลด์">
      <TableComp />
    </PageShell>
  );
}