
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/RolesEdit";

export default function Page() {
  return (
    <PageShell title="แก้ไข บทบาท">
      <FormComp />
    </PageShell>
  );
}