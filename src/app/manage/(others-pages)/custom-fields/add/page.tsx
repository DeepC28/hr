
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/CustomFieldsAdd";

export default function Page() {
  return (
    <PageShell title="เพิ่ม นิยามฟิลด์">
      <FormComp />
    </PageShell>
  );
}