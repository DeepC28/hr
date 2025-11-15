
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/CustomFieldsEdit";

export default function Page() {
  return (
    <PageShell title="แก้ไข นิยามฟิลด์">
      <FormComp />
    </PageShell>
  );
}