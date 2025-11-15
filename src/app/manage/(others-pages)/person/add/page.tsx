
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/PersonAdd";

export default function Page() {
  return (
    <PageShell title="เพิ่ม รายชื่อบุคคล">
      <FormComp />
    </PageShell>
  );
}