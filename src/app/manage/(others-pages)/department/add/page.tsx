
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/DepartmentAdd";

export default function Page() {
  return (
    <PageShell title="เพิ่ม หน่วยงาน">
      <FormComp />
    </PageShell>
  );
}