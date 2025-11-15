
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/CustomFieldValuesAdd";

export default function Page() {
  return (
    <PageShell title="เพิ่ม ค่าฟิลด์">
      <FormComp />
    </PageShell>
  );
}