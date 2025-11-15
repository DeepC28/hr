
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/ProfileEdit";

export default function Page() {
  return (
    <PageShell title="แก้ไข ข้อมูลผู้ใช้">
      <FormComp />
    </PageShell>
  );
}