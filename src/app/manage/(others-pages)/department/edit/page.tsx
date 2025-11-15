
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/DepartmentEdit";

export default function Page() {
  return (
    <PageShell title="แก้ไข หน่วยงาน">
      <FormComp />
    </PageShell>
  );
}