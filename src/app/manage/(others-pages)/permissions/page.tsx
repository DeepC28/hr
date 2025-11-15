
import React from "react";
import PageShell from "@/components/PageShell";
import TableComp from "@/components/tables/permissions";

export default function Page() {
  return (
    <PageShell title="สิทธิ์ (Permissions)">
      <TableComp />
    </PageShell>
  );
}