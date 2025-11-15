
import React from "react";
import PageShell from "@/components/PageShell";
import TableComp from "@/components/tables/university";

export default function Page() {
  return (
    <PageShell title="มหาวิทยาลัย">
      <TableComp />
    </PageShell>
  );
}