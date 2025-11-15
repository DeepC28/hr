
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/CustomFieldValuesEdit";

export default function Page() {
  return (
    <PageShell title="แก้ไข ค่าฟิลด์">
      <FormComp />
    </PageShell>
  );
}